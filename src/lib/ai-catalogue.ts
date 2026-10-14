/**
 * Server-only catalogue access for the AI assistant.
 * Loads real Supabase product rows including `hidden_references` for matching.
 * Never expose hidden_references or purchase_price to the browser.
 */

import { unstable_cache } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseClient } from "@/lib/supabase/client";
import { resolveProductImageUrl, type Product } from "@/lib/products";
import { searchProducts as rpcSearchProducts } from "@/lib/products-api";

/** Internal AI row — includes searchable hidden refs (server only). */
export type AiCatalogueProduct = Product & {
  /** Cross-refs / OE aliases — searchable, never returned to clients. */
  hiddenReferences: string;
};

const AI_COLUMNS =
  "id, slug, name, name_en, sku, code, brand, description, description_en, category, image_url, selling_price, featured, stock_status, stock_qty, hidden_references" as const;

type DbRow = {
  id: string;
  slug?: string | null;
  name: string;
  name_en?: string | null;
  sku: string;
  code?: string | null;
  brand?: string | null;
  description?: string | null;
  description_en?: string | null;
  category: string;
  image_url?: string | null;
  selling_price?: number | null;
  featured?: boolean | null;
  stock_status?: string | null;
  stock_qty?: number | null;
  hidden_references?: string | null;
};

function mapAiRow(row: DbRow): AiCatalogueProduct {
  return {
    id: row.id,
    slug: row.slug || row.id,
    sku: row.sku,
    code: row.code ?? "",
    name: {
      sq: row.name,
      en: row.name_en?.trim() ? row.name_en : row.name,
    },
    description: {
      sq: row.description ?? "",
      en: row.description_en?.trim()
        ? row.description_en
        : (row.description ?? ""),
    },
    brand: row.brand ?? "",
    category: row.category,
    image: resolveProductImageUrl(row.image_url),
    sellingPrice:
      row.selling_price === null || row.selling_price === undefined
        ? null
        : Number(row.selling_price),
    featured: Boolean(row.featured),
    stockStatus: (row.stock_status as Product["stockStatus"]) || "on_request",
    stockQty:
      row.stock_qty === null || row.stock_qty === undefined
        ? null
        : Number(row.stock_qty),
    hiddenReferences: row.hidden_references?.trim() || "",
  };
}

/** Strip secrets before any client / model reply payload. */
export function toPublicProduct(p: AiCatalogueProduct): Product {
  const { hiddenReferences: _hidden, ...rest } = p;
  return rest;
}

/**
 * Full catalogue snapshot for AI ranking (service role).
 * Falls back to public list (no hidden refs) if service role is unset.
 */
async function loadAiCatalogueUncached(): Promise<AiCatalogueProduct[]> {
  const service = createServiceSupabaseClient();
  if (service) {
    const { data, error } = await service
      .from("products")
      .select(AI_COLUMNS)
      .order("featured", { ascending: false })
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (!error && data) {
      return (data as DbRow[]).map(mapAiRow);
    }
    console.warn(
      "[ai-catalogue] service role fetch failed:",
      error?.message ?? "unknown"
    );
  }

  // Fallback: public view + RPC path later (no hidden_references in rows)
  const anon = createSupabaseClient();
  if (!anon) return [];
  const { data, error } = await anon
    .from("products_public")
    .select(
      "id, slug, name, name_en, sku, code, brand, description, description_en, category, image_url, selling_price, featured, stock_status, stock_qty"
    )
    .order("brand", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    console.warn("[ai-catalogue] public fallback failed:", error?.message);
    return [];
  }

  return (data as DbRow[]).map((row) =>
    mapAiRow({ ...row, hidden_references: "" })
  );
}

export const getAiCatalogueCached = unstable_cache(
  async () => loadAiCatalogueUncached(),
  ["ai-catalogue-full-v1"],
  { revalidate: 90 }
);

/**
 * Hybrid candidate gather: Supabase RPC (searches hidden_references in SQL)
 * ∪ full AI catalogue for local re-rank with hidden refs scoring.
 */
export async function gatherAiCandidates(
  queries: string[]
): Promise<AiCatalogueProduct[]> {
  const catalogue = await getAiCatalogueCached();
  const byId = new Map<string, AiCatalogueProduct>();
  for (const p of catalogue) byId.set(p.id, p);

  for (const q of queries.slice(0, 5)) {
    const trimmed = q.trim();
    if (!trimmed) continue;
    try {
      const rows = await rpcSearchProducts(trimmed);
      for (const row of rows) {
        const full = byId.get(row.id);
        if (full) byId.set(row.id, full);
        else {
          // RPC hit not in cache snapshot — keep public fields only
          byId.set(row.id, { ...row, hiddenReferences: "" });
        }
      }
    } catch {
      /* continue */
    }
  }

  return [...byId.values()];
}
