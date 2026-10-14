/**
 * "Gjej pjesën" — Buli-style AI parts finder.
 * Returns only real catalogue products. Never invents fitment or SKUs.
 */

import { formatPrice, getLocalized, type Product } from "@/lib/products";
import { productCanonicalPath } from "@/lib/seo";
import { runProductSearch } from "@/lib/search-service";
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
      ? `For “${q}” — we found this:`
      : `For “${q}” — here’s what we have:`;
  }
  if (count === 0) return "";
  return count === 1
    ? `Për “${q}” — kjo kemi:`
    : `Për “${q}” — këto kemi:`;
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

  if (aiSearchEnabled()) {
    const expansion = await expandQueryWithAi(q);
    if (expansion?.expandedTerms?.length) {
      aiUsed = true;
      expandedHint = expansion.expandedTerms;
    }
  }

  const search = await runProductSearch(q, {
    locale,
    limit,
    useAi: true,
  });
  aiUsed = aiUsed || search.meta.aiUsed;

  const items = search.products.slice(0, limit).map((p) => toItem(p, locale));

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
