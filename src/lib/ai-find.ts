/**
 * Single-shot stock lookup — grounded in real catalogue products only.
 * Never invents fitment or SKUs.
 */

import { formatPrice, getLocalized, type Product } from "@/lib/products";
import { productCanonicalPath } from "@/lib/seo";
import { gatherAiCandidates, toPublicProduct } from "@/lib/ai-catalogue";
import { rankProductsForQuery } from "@/lib/search-engine";
import { expandQueryWithSynonyms } from "@/lib/search-synonyms";
import {
  aiSearchEnabled,
  composeFindIntroWithAi,
  expandQueryWithAi,
} from "@/lib/search-ai";
import type { Locale } from "@/lib/translations";

export type AiFindItem = {
  title: string;
  price: string | null;
  url: string;
  image: string;
  slug: string;
  sku: string;
  brand: string;
};

export type AiFindResponse = {
  intro: string;
  items: AiFindItem[];
  meta: {
    query: string;
    aiUsed: boolean;
    resultCount: number;
  };
};

function fallbackIntro(query: string, count: number, locale: Locale): string {
  const q = query.trim();
  if (locale === "en") {
    if (count === 0) return "";
    return count === 1
      ? `For “${q}” — one match in the catalogue:`
      : `For “${q}” — matches in the catalogue:`;
  }
  if (count === 0) return "";
  return count === 1
    ? `Për “${q}” — një përputhje në katalog:`
    : `Për “${q}” — ja çfarë kemi në listë:`;
}

function toItem(product: Product, locale: Locale): AiFindItem {
  return {
    title: getLocalized(product.name, locale),
    price:
      product.sellingPrice != null && product.sellingPrice > 0
        ? formatPrice(product.sellingPrice, locale)
        : null,
    url: productCanonicalPath(product.slug),
    image: product.image || "/logo.png",
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
  };
}

/**
 * Natural-language find: expand with AI (optional), search catalogue, compose intro.
 */
export async function runAiFind(
  query: string,
  opts: { locale?: Locale; limit?: number } = {}
): Promise<AiFindResponse> {
  const locale = opts.locale ?? "sq";
  const limit = Math.min(Math.max(opts.limit ?? 8, 1), 12);
  const q = query.trim().slice(0, 120);

  if (!q) {
    return {
      intro: "",
      items: [],
      meta: { query: "", aiUsed: false, resultCount: 0 },
    };
  }

  let aiUsed = false;
  let expandedHint: string[] = [];
  const queries = expandQueryWithSynonyms(q);

  if (aiSearchEnabled()) {
    const expansion = await expandQueryWithAi(q);
    if (expansion?.expandedTerms?.length) {
      aiUsed = true;
      expandedHint = expansion.expandedTerms;
      for (const term of expansion.expandedTerms) {
        if (!queries.includes(term)) queries.push(term);
      }
    }
  }

  const candidates = await gatherAiCandidates(queries);
  const ranked = rankProductsForQuery(candidates, q, locale);

  /**
   * Stricter gate than catalogue browse: only surface confident hits.
   * Weak / empty → WhatsApp handoff in the UI.
   */
  const MIN_AI_SCORE = 140;
  const confident = ranked.filter((h) => {
    if (h.score < MIN_AI_SCORE) return false;
    return h.reasons.some((r) =>
      ["sku", "code", "hidden_ref", "identifier", "name", "brand"].includes(r)
    );
  });

  const items = confident
    .slice(0, limit)
    .map((h) => {
      const full = candidates.find((c) => c.id === h.product.id);
      return toItem(full ? toPublicProduct(full) : h.product, locale);
    });

  let intro = fallbackIntro(q, items.length, locale);
  if (items.length > 0 && aiSearchEnabled()) {
    const composed = await composeFindIntroWithAi({
      query: q,
      locale,
      titles: items.map((i) => i.title).slice(0, 4),
      expandedTerms: expandedHint,
    });
    if (composed) {
      intro = composed;
      aiUsed = true;
    }
  }

  return {
    intro,
    items,
    meta: {
      query: q,
      aiUsed,
      resultCount: items.length,
    },
  };
}
