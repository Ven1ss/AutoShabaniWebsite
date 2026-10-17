/**
 * Semantic retrieval via OpenAI/AI Gateway embeddings + Supabase pgvector.
 * Falls back gracefully when key/migration/index is unavailable.
 */

import { createHash } from "crypto";
import { getAiProviderConfig } from "@/lib/ai-provider";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { AiCatalogueProduct } from "@/lib/ai-catalogue";

export function productEmbedText(product: AiCatalogueProduct): string {
  return [
    product.name.sq,
    product.name.en,
    product.brand,
    product.category,
    product.sku,
    product.code,
    product.description.sq,
    product.description.en,
    product.hiddenReferences,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

export function contentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 40);
}

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const cfg = getAiProviderConfig();
  if (!cfg || texts.length === 0) return null;

  try {
    const res = await fetch(`${cfg.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.embeddingModel,
        input: texts,
      }),
    });
    if (!res.ok) {
      console.warn("[embeddings] provider error", res.status);
      return null;
    }
    const data = (await res.json()) as {
      data?: { embedding: number[]; index: number }[];
    };
    const rows = data.data ?? [];
    return rows
      .sort((a, b) => a.index - b.index)
      .map((r) => r.embedding);
  } catch (error) {
    console.warn("[embeddings] failed:", (error as Error)?.message);
    return null;
  }
}

export async function embedQuery(query: string): Promise<number[] | null> {
  const vectors = await embedTexts([query.trim().slice(0, 1000)]);
  return vectors?.[0] ?? null;
}

/**
 * Nearest product ids from pgvector. Empty if unavailable.
 */
export async function matchProductsByEmbedding(
  query: string,
  opts?: { matchCount?: number; minSimilarity?: number }
): Promise<{ productId: string; similarity: number }[]> {
  const embedding = await embedQuery(query);
  if (!embedding) return [];

  const service = createServiceSupabaseClient();
  if (!service) return [];

  const { data, error } = await service.rpc("match_products", {
    query_embedding: embedding,
    match_count: opts?.matchCount ?? 24,
    min_similarity: opts?.minSimilarity ?? 0.52,
  });

  if (error) {
    // Migration not applied yet — silent fallback
    console.warn("[embeddings] match_products:", error.message);
    return [];
  }

  return (data as { product_id: string; similarity: number }[] | null)?.map(
    (row) => ({
      productId: row.product_id,
      similarity: row.similarity,
    })
  ) ?? [];
}

/**
 * Upsert embeddings for catalogue products that changed.
 * Returns how many rows were written.
 */
export async function reindexProductEmbeddings(
  products: AiCatalogueProduct[],
  opts?: { limit?: number }
): Promise<{ written: number; skipped: number }> {
  const service = createServiceSupabaseClient();
  if (!service) return { written: 0, skipped: 0 };

  const limit = opts?.limit ?? 80;
  let written = 0;
  let skipped = 0;

  // Load existing hashes
  const { data: existing } = await service
    .from("product_embeddings")
    .select("product_id, content_hash");

  const hashById = new Map<string, string>(
    (existing as { product_id: string; content_hash: string }[] | null)?.map(
      (r) => [r.product_id, r.content_hash]
    ) ?? []
  );

  const pending: { product: AiCatalogueProduct; text: string; hash: string }[] =
    [];
  for (const product of products) {
    const text = productEmbedText(product);
    const hash = contentHash(text);
    if (hashById.get(product.id) === hash) {
      skipped += 1;
      continue;
    }
    pending.push({ product, text, hash });
    if (pending.length >= limit) break;
  }

  // Batch embed
  for (let i = 0; i < pending.length; i += 16) {
    const batch = pending.slice(i, i + 16);
    const vectors = await embedTexts(batch.map((b) => b.text));
    if (!vectors) break;

    const rows = batch.map((b, idx) => ({
      product_id: b.product.id,
      embedding: vectors[idx],
      content_hash: b.hash,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await service.from("product_embeddings").upsert(rows);
    if (error) {
      console.warn("[embeddings] upsert failed:", error.message);
      break;
    }
    written += rows.length;
  }

  return { written, skipped };
}
