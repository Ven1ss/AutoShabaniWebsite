import { searchProducts as rpcSearchProducts, getProducts } from "@/lib/products-api";
import type { Product } from "@/lib/products";
import {
  rankProductsForQuery,
  type MatchReason,
  type ScoredProduct,
} from "@/lib/search-engine";
import { expandQueryWithSynonyms } from "@/lib/search-synonyms";
import { aiSearchEnabled, expandQueryWithAi } from "@/lib/search-ai";
import { normalizeIdentifier } from "@/lib/search-normalize";

export type SearchHit = {
  product: Product;
  score: number;
  reasons: MatchReason[];
};

export type SearchResponse = {
  products: Product[];
  hits: SearchHit[];
  meta: {
    query: string;
    expandedQueries: string[];
    aiUsed: boolean;
    resultCount: number;
    fallback: "rpc" | "local" | "hybrid";
  };
};

export type SuggestItem = {
  type: "product" | "brand" | "query";
  label: string;
  subtitle?: string;
  slug?: string;
  query?: string;
};

function uniqProducts(rows: Product[]): Product[] {
  const map = new Map<string, Product>();
  for (const p of rows) map.set(p.id, p);
  return [...map.values()];
}

/**
 * Hybrid catalogue search:
 * 1) Supabase RPC candidates (identity + text fields)
 * 2) Local synonym/fuzzy re-rank over RPC ∪ full list when needed
 * 3) Optional AI query expansion (terms only — never invents products)
 */
export async function runProductSearch(
  query: string,
  opts: { locale?: "sq" | "en"; limit?: number; useAi?: boolean } = {}
): Promise<SearchResponse> {
  const q = query.trim().slice(0, 120);
  const locale = opts.locale ?? "sq";
  const limit = Math.min(Math.max(opts.limit ?? 48, 1), 100);
  const expandedQueries = expandQueryWithSynonyms(q);

  let aiUsed = false;
  if (opts.useAi !== false && aiSearchEnabled()) {
    const ai = await expandQueryWithAi(q);
    if (ai?.expandedTerms?.length) {
      aiUsed = true;
      for (const term of ai.expandedTerms) {
        if (!expandedQueries.includes(term)) expandedQueries.push(term);
      }
    }
  }

  // Gather candidates from RPC for each expanded query (capped)
  const rpcChunks: Product[][] = [];
  for (const variant of expandedQueries.slice(0, 4)) {
    try {
      const rows = await rpcSearchProducts(variant);
      rpcChunks.push(rows);
    } catch {
      /* continue */
    }
  }

  let candidates = uniqProducts(rpcChunks.flat());
  let fallback: SearchResponse["meta"]["fallback"] = "rpc";

  // If RPC returned little for a fuzzy natural-language query, widen with local catalogue
  const idLike = normalizeIdentifier(q).length >= 6;
  if (candidates.length < 8 && !idLike) {
    const all = await getProducts();
    candidates = uniqProducts([...candidates, ...all]);
    fallback = candidates.length ? "hybrid" : "local";
  }

  if (candidates.length === 0) {
    const all = await getProducts();
    candidates = all;
    fallback = "local";
  }

  const ranked = rankProductsForQuery(candidates, q, locale).slice(0, limit);

  // Also try expanded variants if original ranking is thin
  if (ranked.length < 5) {
    for (const variant of expandedQueries.slice(1, 4)) {
      for (const row of rankProductsForQuery(candidates, variant, locale)) {
        if (!ranked.some((r) => r.product.id === row.product.id)) {
          ranked.push(row);
        }
      }
      if (ranked.length >= limit) break;
    }
    ranked.sort((a, b) => b.score - a.score);
  }

  const finalHits = ranked.slice(0, limit);
  return {
    products: finalHits.map((h) => h.product),
    hits: finalHits.map((h) => ({
      product: h.product,
      score: h.score,
      reasons: h.reasons,
    })),
    meta: {
      query: q,
      expandedQueries,
      aiUsed,
      resultCount: finalHits.length,
      fallback,
    },
  };
}

export async function suggestSearch(
  query: string,
  opts: { locale?: "sq" | "en"; limit?: number } = {}
): Promise<SuggestItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const locale = opts.locale ?? "sq";
  const limit = Math.min(opts.limit ?? 8, 12);

  const result = await runProductSearch(q, {
    locale,
    limit: 12,
    useAi: false,
  });

  const items: SuggestItem[] = [];
  const brands = new Set<string>();

  for (const hit of result.hits.slice(0, limit)) {
    const name = hit.product.name[locale] || hit.product.name.sq;
    items.push({
      type: "product",
      label: name,
      subtitle: [hit.product.brand, hit.product.sku].filter(Boolean).join(" · "),
      slug: hit.product.slug,
      query: name,
    });
    if (hit.product.brand) brands.add(hit.product.brand);
  }

  for (const brand of brands) {
    if (items.length >= limit) break;
    if (brand.toLowerCase().includes(q.toLowerCase())) {
      items.push({
        type: "brand",
        label: brand,
        subtitle: locale === "sq" ? "Markë" : "Brand",
        query: brand,
      });
    }
  }

  // Synonym refinement suggestion
  const expanded = expandQueryWithSynonyms(q);
  if (expanded[1] && items.length < limit) {
    items.push({
      type: "query",
      label: expanded[1],
      subtitle: locale === "sq" ? "Provo këtë kërkim" : "Try this search",
      query: expanded[1],
    });
  }

  return items.slice(0, limit);
}

export function topReason(hit: ScoredProduct | SearchHit): MatchReason | null {
  const priority: MatchReason[] = [
    "sku",
    "code",
    "hidden_ref",
    "identifier",
    "name",
    "brand",
    "synonym",
    "description",
    "category",
    "fuzzy",
  ];
  for (const r of priority) {
    if (hit.reasons.includes(r)) return r;
  }
  return hit.reasons[0] ?? null;
}
