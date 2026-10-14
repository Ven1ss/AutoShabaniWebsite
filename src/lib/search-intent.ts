/**
 * Automotive intent detection — maps natural-language queries to required
 * catalogue evidence so weak fuzzy/synonym noise cannot dominate results.
 */

import { normalizeText, significantQueryText } from "@/lib/search-normalize";
import type { RankableProduct } from "@/lib/search-engine";
import type { MatchReason } from "@/lib/search-engine";

export type ProductIntent = {
  id: string;
  /** Human labels / query triggers (sq + en, colloquial). */
  triggers: string[];
  /** Terms that must appear in name/category/description (normalized). */
  mustMatch: string[];
  /** Optional category substrings that confirm the intent. */
  categories?: string[];
};

/** High-confidence spare-parts intents for Kosovo retail language. */
export const PRODUCT_INTENTS: ProductIntent[] = [
  {
    id: "antifreeze",
    triggers: [
      "antifriz",
      "antifreeze",
      "coolant",
      "engine coolant",
      "radiator coolant",
      "leng ftohje",
      "lëng ftohje",
      "ftohje motori",
      "g11",
      "g12",
      "g13",
    ],
    mustMatch: ["antifriz", "antifreeze", "coolant", "ftohje"],
    categories: ["antifriz", "coolant"],
  },
  {
    id: "engine_oil",
    triggers: [
      "vaj motori",
      "vaj motor",
      "engine oil",
      "motor oil",
      "5w30",
      "5w-30",
      "10w40",
      "10w-40",
      "0w20",
      "0w-20",
    ],
    mustMatch: ["vaj", "oil", "motor"],
    categories: ["vaj", "oil"],
  },
  {
    id: "oil_filter",
    triggers: [
      "filtri vajit",
      "filter i vajit",
      "filtri i vajit",
      "oil filter",
      "filter vaji",
    ],
    mustMatch: ["filter", "filtri", "vaj", "oil"],
    categories: ["filter", "filtra"],
  },
  {
    id: "air_filter",
    triggers: [
      "filtri ajrit",
      "filter i ajrit",
      "air filter",
      "filtri i ajrit",
    ],
    mustMatch: ["filter", "filtri", "ajr", "air"],
    categories: ["filter", "filtra"],
  },
  {
    id: "brake_pads",
    triggers: [
      "feroda",
      "ferodat",
      "brake pads",
      "pllakat e frenave",
      "pllaka freni",
    ],
    mustMatch: ["ferod", "brake", "fren", "pad", "pllak"],
    categories: ["fren", "brake"],
  },
  {
    id: "brake_disc",
    triggers: ["disqe freni", "disk freni", "brake disc", "brake disk"],
    mustMatch: ["disk", "disqe", "fren", "brake"],
    categories: ["fren", "brake"],
  },
];

function compact(s: string): string {
  return normalizeText(s).replace(/\s+/g, "");
}

/**
 * Detect the strongest product intent in a customer query.
 * Returns null for free-form / identifier / brand-only searches.
 */
export function detectProductIntent(query: string): ProductIntent | null {
  const q = normalizeText(significantQueryText(query) || query);
  const qc = compact(q);
  if (!q) return null;

  let best: { intent: ProductIntent; len: number } | null = null;
  for (const intent of PRODUCT_INTENTS) {
    for (const trigger of intent.triggers) {
      const t = normalizeText(trigger);
      const tc = compact(trigger);
      if (!t) continue;
      const hit =
        q === t ||
        q.includes(` ${t} `) ||
        q.startsWith(`${t} `) ||
        q.endsWith(` ${t}`) ||
        (tc.length >= 4 && qc.includes(tc));
      if (hit && (!best || t.length > best.len)) {
        best = { intent, len: t.length };
      }
    }
  }
  return best?.intent ?? null;
}

/** True when the product text evidence supports the detected intent. */
export function productMatchesIntent(
  product: RankableProduct,
  intent: ProductIntent,
  locale: "sq" | "en" = "sq"
): boolean {
  const hay = normalizeText(
    [
      product.name[locale],
      product.name.sq,
      product.name.en,
      product.category,
      product.description[locale],
      product.description.sq,
      product.description.en,
      product.brand,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const hayC = compact(hay);

  if (
    intent.categories?.some((c) => hay.includes(normalizeText(c)))
  ) {
    return true;
  }

  return intent.mustMatch.some((term) => {
    const t = normalizeText(term);
    const tc = compact(term);
    return (
      (t.length >= 3 && hay.includes(t)) ||
      (tc.length >= 4 && hayC.includes(tc))
    );
  });
}

const STRONG_REASONS: MatchReason[] = [
  "sku",
  "code",
  "hidden_ref",
  "identifier",
  "name",
  "brand",
  "category",
];

/**
 * Strict relevance gate for AI results.
 * - With intent: product must evidence that intent (drops perfume for antifreeze).
 * - Without intent: require a strong field match (not fuzzy-only).
 */
export function passesStrictRelevance(
  score: number,
  reasons: MatchReason[],
  product: RankableProduct,
  intent: ProductIntent | null,
  locale: "sq" | "en",
  opts?: { minScore?: number }
): boolean {
  const minScore = opts?.minScore ?? 100;
  if (score < minScore) return false;

  if (intent) {
    return productMatchesIntent(product, intent, locale);
  }

  const strong = reasons.some((r) => STRONG_REASONS.includes(r));
  // Allow synonym+name path; block fuzzy-only noise
  if (reasons.includes("fuzzy") && !strong && !reasons.includes("synonym")) {
    return false;
  }
  if (reasons.length === 1 && reasons[0] === "fuzzy") return false;
  if (reasons.length === 1 && reasons[0] === "synonym") return false;
  return strong || (reasons.includes("synonym") && reasons.includes("name"));
}

/** Expand synonym list for known intents (coolant ↔ antifriz, etc.). */
export function intentSearchQueries(
  query: string,
  intent: ProductIntent | null
): string[] {
  const base = significantQueryText(query) || query.trim();
  const out = new Set<string>([query.trim(), base].filter(Boolean));
  if (!intent) return [...out];

  // Prefer searching by the canonical intent terms themselves for category recall
  for (const term of intent.mustMatch.slice(0, 4)) {
    out.add(term);
  }
  for (const cat of intent.categories ?? []) {
    out.add(cat);
  }
  // Keep a couple of natural triggers
  for (const t of intent.triggers.slice(0, 3)) {
    out.add(t);
  }
  return [...out].filter(Boolean).slice(0, 10);
}
