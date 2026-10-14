import type { Product } from "@/lib/products";
import {
  compactText,
  isIdentifierLike,
  normalizeIdentifier,
  normalizeText,
  tokenizeQuery,
} from "@/lib/search-normalize";
import { expandQueryWithSynonyms } from "@/lib/search-synonyms";
import { withinEditDistance } from "@/lib/search-rank";

export type MatchReason =
  | "sku"
  | "code"
  | "identifier"
  | "hidden_ref"
  | "brand"
  | "name"
  | "description"
  | "category"
  | "synonym"
  | "fuzzy";

/** Optional server-only fields used for ranking (never sent to clients). */
export type RankableProduct = Product & {
  hiddenReferences?: string;
};

export type ScoredProduct = {
  product: Product;
  score: number;
  reasons: MatchReason[];
};

const WEIGHTS = {
  skuExact: 1000,
  codeExact: 950,
  idIncludes: 700,
  nameExact: 500,
  brandExact: 420,
  nameIncludes: 280,
  brandIncludes: 220,
  descriptionIncludes: 160,
  categoryIncludes: 140,
  synonymBoost: 120,
  fuzzyToken: 70,
  featured: 15,
} as const;

const MIN_SCORE = 55;

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }
  return prev[b.length];
}

function fieldHaystacks(product: Product, locale: "sq" | "en") {
  return {
    sku: product.sku ?? "",
    code: product.code ?? "",
    brand: product.brand ?? "",
    name: product.name[locale] || product.name.sq || product.name.en || "",
    nameAlt: locale === "sq" ? product.name.en : product.name.sq,
    description:
      product.description[locale] ||
      product.description.sq ||
      product.description.en ||
      "",
    category: product.category ?? "",
  };
}

function scoreAgainstQuery(
  product: RankableProduct,
  query: string,
  locale: "sq" | "en",
  fromSynonym: boolean
): ScoredProduct | null {
  const qRaw = query.trim();
  if (!qRaw) return null;

  const qText = normalizeText(qRaw);
  const qCompact = compactText(qRaw);
  const qId = normalizeIdentifier(qRaw);
  const tokens = tokenizeQuery(qRaw);
  const fields = fieldHaystacks(product, locale);
  const reasons = new Set<MatchReason>();
  let score = 0;

  const skuId = normalizeIdentifier(fields.sku);
  const codeId = normalizeIdentifier(fields.code);
  const hiddenRaw = product.hiddenReferences ?? "";
  const hiddenId = normalizeIdentifier(hiddenRaw);
  const hiddenCompact = compactText(hiddenRaw);

  // Layer A — identifiers (SKU / code / hidden cross-refs)
  if (qId.length >= 3) {
    if (skuId && skuId === qId) {
      score += WEIGHTS.skuExact;
      reasons.add("sku");
    } else if (codeId && codeId === qId) {
      score += WEIGHTS.codeExact;
      reasons.add("code");
    } else if (hiddenId && hiddenId === qId) {
      score += WEIGHTS.codeExact;
      reasons.add("hidden_ref");
    } else if (skuId && (skuId.includes(qId) || qId.includes(skuId))) {
      // Prefer prefix/contains for partial SKU; penalize if very short query
      const boost =
        qId.length >= 5 ? WEIGHTS.idIncludes : Math.floor(WEIGHTS.idIncludes * 0.45);
      score += boost;
      reasons.add("sku");
    } else if (codeId && (codeId.includes(qId) || qId.includes(codeId))) {
      const boost =
        qId.length >= 5 ? WEIGHTS.idIncludes : Math.floor(WEIGHTS.idIncludes * 0.45);
      score += boost;
      reasons.add("code");
    } else if (
      hiddenId &&
      qId.length >= 5 &&
      (hiddenId.includes(qId) || qId.includes(hiddenId))
    ) {
      score += WEIGHTS.idIncludes;
      reasons.add("hidden_ref");
    } else if (
      qCompact.length >= 4 &&
      hiddenCompact &&
      hiddenCompact.includes(qCompact)
    ) {
      score += Math.floor(WEIGHTS.idIncludes * 0.85);
      reasons.add("hidden_ref");
    }
  }

  // Avoid treating digit-heavy identifiers as fuzzy name matches only
  const identifierQuery = isIdentifierLike(qRaw) || /^\d{4,}$/.test(qId);

  const nameN = normalizeText(fields.name);
  const nameAltN = normalizeText(fields.nameAlt);
  const brandN = normalizeText(fields.brand);
  const descN = normalizeText(fields.description);
  const catN = normalizeText(fields.category);
  const nameC = compactText(fields.name);
  const brandC = compactText(fields.brand);

  if (!identifierQuery || score < WEIGHTS.idIncludes) {
    if (nameN === qText || nameAltN === qText || nameC === qCompact) {
      score += WEIGHTS.nameExact;
      reasons.add("name");
    } else if (
      (qText.length >= 3 && (nameN.includes(qText) || nameAltN.includes(qText))) ||
      (qCompact.length >= 3 && nameC.includes(qCompact))
    ) {
      score += WEIGHTS.nameIncludes;
      reasons.add("name");
    }

    if (brandN === qText || brandC === qCompact) {
      score += WEIGHTS.brandExact;
      reasons.add("brand");
    } else if (
      qText.length >= 2 &&
      (brandN.includes(qText) || brandC.includes(qCompact))
    ) {
      score += WEIGHTS.brandIncludes;
      reasons.add("brand");
    }

    if (qText.length >= 4 && descN.includes(qText)) {
      score += WEIGHTS.descriptionIncludes;
      reasons.add("description");
    }

    if (qText.length >= 3 && catN.includes(qText)) {
      score += WEIGHTS.categoryIncludes;
      reasons.add("category");
    }
  }

  // Token includes / fuzzy (typos). Prefer exact token includes over edit-distance.
  let strongTokenHit = false;
  for (const token of tokens) {
    if (token.length < 3) continue;
    const t = token;
    const candidates = [nameN, nameAltN, brandN, catN, descN].filter(Boolean);
    let tokenHit = false;
    for (const field of candidates) {
      if (field.includes(t)) {
        score += Math.floor(WEIGHTS.fuzzyToken * 0.85);
        reasons.add("fuzzy");
        strongTokenHit = true;
        tokenHit = true;
        break;
      }
    }
    if (tokenHit) continue;

    // Edit-distance only for longer tokens (avoid "makin" ≈ random short words)
    if (t.length < 5) continue;
    for (const field of candidates) {
      const words = field.split(" ").filter((w) => w.length >= 4);
      for (const w of words) {
        const maxDist = t.length >= 7 ? 2 : 1;
        if (withinEditDistance(w.slice(0, t.length + 1), t, maxDist)) {
          score += Math.floor(WEIGHTS.fuzzyToken * 0.55);
          reasons.add("fuzzy");
          tokenHit = true;
          break;
        }
        if (
          t.length >= 5 &&
          w.length >= 5 &&
          editDistance(t, w.slice(0, t.length)) <= 1
        ) {
          score += Math.floor(WEIGHTS.fuzzyToken * 0.55);
          reasons.add("fuzzy");
          tokenHit = true;
          break;
        }
      }
      if (tokenHit) break;
    }
  }

  // Synonym boost only when the product actually matched a meaningful field
  // for this variant — never boost fuzzy-only noise from filler tokens.
  if (
    fromSynonym &&
    score > 0 &&
    (strongTokenHit ||
      reasons.has("name") ||
      reasons.has("brand") ||
      reasons.has("category") ||
      reasons.has("description") ||
      reasons.has("sku") ||
      reasons.has("code") ||
      reasons.has("hidden_ref"))
  ) {
    score += WEIGHTS.synonymBoost;
    reasons.add("synonym");
  }

  if (product.featured && score > 0) score += WEIGHTS.featured;

  if (score < MIN_SCORE || reasons.size === 0) return null;
  return { product, score, reasons: [...reasons] };
}

/**
 * Rank products for a customer query using hybrid signals.
 * Does not invent products — only scores the provided catalogue rows.
 */
export function rankProductsForQuery(
  products: RankableProduct[],
  query: string,
  locale: "sq" | "en" = "sq"
): ScoredProduct[] {
  const q = query.trim();
  if (!q) return [];

  const variants = expandQueryWithSynonyms(q);
  const byId = new Map<string, ScoredProduct>();

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const fromSynonym = i > 0;
    for (const product of products) {
      const scored = scoreAgainstQuery(product, variant, locale, fromSynonym);
      if (!scored) continue;
      const prev = byId.get(product.id);
      if (!prev || scored.score > prev.score) {
        byId.set(product.id, {
          ...scored,
          reasons: [
            ...new Set([...(prev?.reasons ?? []), ...scored.reasons]),
          ],
        });
      } else if (prev) {
        prev.reasons = [...new Set([...prev.reasons, ...scored.reasons])];
      }
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.product.featured) - Number(a.product.featured) ||
      a.product.name.sq.localeCompare(b.product.name.sq)
  );
}

export function reasonLabelSq(reason: MatchReason): string {
  switch (reason) {
    case "sku":
      return "Përputhje me SKU";
    case "code":
      return "Përputhje me kodin";
    case "identifier":
      return "Përputhje me referencën";
    case "brand":
      return "Përputhje me markën";
    case "name":
      return "Përputhje me emrin";
    case "description":
      return "Përputhje me përshkrimin";
    case "category":
      return "Përputhje me kategorinë";
    case "synonym":
      return "Sipas terminologjisë";
    case "fuzzy":
      return "Përputhje e përafërt";
    default:
      return "Përputhje";
  }
}

export function reasonLabelEn(reason: MatchReason): string {
  switch (reason) {
    case "sku":
      return "SKU match";
    case "code":
      return "Code match";
    case "identifier":
      return "Reference match";
    case "brand":
      return "Brand match";
    case "name":
      return "Name match";
    case "description":
      return "Description match";
    case "category":
      return "Category match";
    case "synonym":
      return "Terminology match";
    case "fuzzy":
      return "Approximate match";
    default:
      return "Match";
  }
}
