/**
 * Multi-layer customer-query understanding for automotive spare-parts AI.
 * Parses intent + required attributes, verifies evidence in real product fields
 * (especially descriptions), and never claims attributes without catalogue proof.
 */

import {
  ATTRIBUTE_GROUPS,
  FUNCTIONAL_PATTERNS,
  REFINE_CHEAPER,
  TYPE_EVIDENCE,
  TYPE_EXCLUDE,
  TYPE_GROUPS,
} from "@/lib/search-lexicon";
import {
  compactText,
  normalizeText,
  significantQueryText,
  tokenizeQuery,
} from "@/lib/search-normalize";
import type { RankableProduct } from "@/lib/search-engine";
import type { MatchReason } from "@/lib/search-engine";

export type MatchConfidence = "confirmed" | "partial" | "none";

export type ParsedQuery = {
  /** Detected product type id, if any. */
  typeId: string | null;
  /** Required attribute ids (e.g. scent:strawberry) that must be evidenced. */
  attributes: string[];
  /** Optional brand filter from query / refinement. */
  brand?: string;
  /** Prefer lower price. */
  preferCheaper?: boolean;
  /** Free-text residual tokens for scoring. */
  residualTokens: string[];
  /** Original + expanded retrieval queries. */
  retrievalQueries: string[];
  /** How the type was detected. */
  typeSource: "trigger" | "functional" | "attribute_context" | "history" | null;
};

export type ProductEvaluation = {
  confidence: MatchConfidence;
  score: number;
  reasons: MatchReason[];
  /** Attributes verified from name/description. */
  confirmedAttributes: string[];
  /** Attributes requested but not found in product text. */
  missingAttributes: string[];
};

function compact(s: string): string {
  return normalizeText(s).replace(/\s+/g, "");
}

function includesAny(hay: string, terms: string[]): boolean {
  const h = normalizeText(hay);
  const hc = compact(hay);
  return terms.some((term) => {
    const t = normalizeText(term);
    const tc = compact(term);
    if (!t) return false;
    return (
      (t.length >= 2 && h.includes(t)) ||
      (tc.length >= 3 && hc.includes(tc))
    );
  });
}

/** Full searchable product text — name, category, brand, BOTH descriptions. */
export function productEvidenceText(
  product: RankableProduct,
  locale: "sq" | "en" = "sq"
): { name: string; full: string; nameC: string; fullC: string } {
  const name = [
    product.name[locale],
    product.name.sq,
    product.name.en,
    product.category,
    product.brand,
    product.sku,
    product.code,
  ]
    .filter(Boolean)
    .join(" ");
  const full = [
    name,
    product.description.sq,
    product.description.en,
    product.description[locale],
    product.hiddenReferences ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    name: normalizeText(name),
    full: normalizeText(full),
    nameC: compact(name),
    fullC: compact(full),
  };
}

export function attributeTerms(attrId: string): string[] {
  return ATTRIBUTE_GROUPS.find((g) => g.id === attrId)?.terms ?? [];
}

export function typeTerms(typeId: string): string[] {
  return TYPE_GROUPS.find((g) => g.id === typeId)?.terms ?? [];
}

/** Detect attributes mentioned in the query. */
export function detectAttributes(query: string): string[] {
  const q = normalizeText(query);
  const qc = compact(query);
  const hit: string[] = [];
  for (const group of ATTRIBUTE_GROUPS) {
    if (
      group.terms.some((term) => {
        const t = normalizeText(term);
        const tc = compact(term);
        return (
          (t.length >= 3 &&
            (q === t ||
              q.includes(` ${t} `) ||
              q.startsWith(`${t} `) ||
              q.endsWith(` ${t}`) ||
              q.includes(t))) ||
          (tc.length >= 4 && qc.includes(tc))
        );
      })
    ) {
      hit.push(group.id);
    }
  }
  return hit;
}

function detectTypeFromTriggers(query: string): string | null {
  const q = normalizeText(significantQueryText(query) || query);
  const qc = compact(q);
  let best: { id: string; len: number } | null = null;
  for (const group of TYPE_GROUPS) {
    for (const term of group.terms) {
      const t = normalizeText(term);
      const tc = compact(term);
      if (!t) continue;
      const hit =
        q === t ||
        q.includes(` ${t} `) ||
        q.startsWith(`${t} `) ||
        q.endsWith(` ${t}`) ||
        (tc.length >= 4 && qc.includes(tc));
      if (hit && (!best || t.length > best.len)) {
        best = { id: group.id, len: t.length };
      }
    }
  }
  return best?.id ?? null;
}

function detectTypeFromFunctional(query: string): string | null {
  const q = normalizeText(query);
  for (const block of FUNCTIONAL_PATTERNS) {
    for (const re of block.patterns) {
      if (re.test(q)) return block.typeId;
    }
  }
  return null;
}

/** True if product text evidences the product type. */
export function productMatchesType(
  product: RankableProduct,
  typeId: string,
  locale: "sq" | "en" = "sq"
): boolean {
  const { name, full, nameC, fullC } = productEvidenceText(product, locale);
  const exclude = TYPE_EXCLUDE[typeId] ?? [];
  if (includesAny(full, exclude)) return false;

  const evidence = TYPE_EVIDENCE[typeId] ?? typeTerms(typeId);

  // Require type cue in NAME or CATEGORY. Descriptions alone are too noisy
  // (interior cleaners often mention "aromë" without being air fresheners).
  return evidence.some((term) => {
    const t = normalizeText(term);
    const tc = compact(term);
    return (
      (t.length >= 3 && name.includes(t)) ||
      (tc.length >= 4 && nameC.includes(tc))
    );
  });
}

/**
 * Verify a required attribute against name + description.
 * Never invents — returns false if no textual evidence.
 */
export function productHasAttribute(
  product: RankableProduct,
  attrId: string,
  locale: "sq" | "en" = "sq"
): boolean {
  const terms = attributeTerms(attrId);
  if (!terms.length) return false;
  const { full, fullC } = productEvidenceText(product, locale);
  return terms.some((term) => {
    const t = normalizeText(term);
    const tc = compact(term);
    return (
      (t.length >= 3 && full.includes(t)) ||
      (tc.length >= 4 && fullC.includes(tc))
    );
  });
}

function buildRetrievalQueries(parsed: ParsedQuery, raw: string): string[] {
  const out = new Set<string>();
  const base = significantQueryText(raw) || raw.trim();
  if (raw.trim()) out.add(raw.trim());
  if (base) out.add(base);

  if (parsed.typeId) {
    for (const t of typeTerms(parsed.typeId).slice(0, 6)) out.add(t);
    for (const e of (TYPE_EVIDENCE[parsed.typeId] ?? []).slice(0, 4)) {
      out.add(e);
    }
  }
  for (const attr of parsed.attributes) {
    for (const t of attributeTerms(attr).slice(0, 6)) out.add(t);
  }
  if (parsed.brand) out.add(parsed.brand);

  // Combined type+attr retrieval (e.g. "arome strawberry")
  if (parsed.typeId && parsed.attributes[0]) {
    const typeHint = TYPE_EVIDENCE[parsed.typeId]?.[0] ?? parsed.typeId;
    const attrHint = attributeTerms(parsed.attributes[0])[0];
    if (typeHint && attrHint) out.add(`${typeHint} ${attrHint}`);
  }

  return [...out].filter(Boolean).slice(0, 14);
}

/**
 * Parse a customer utterance into structured intent.
 * `prior` merges conversation context for refinements.
 */
export function parseCustomerQuery(
  query: string,
  prior?: ParsedQuery | null
): ParsedQuery {
  const raw = query.trim();
  const attrs = detectAttributes(raw);
  let typeId = detectTypeFromTriggers(raw);
  let typeSource: ParsedQuery["typeSource"] = typeId ? "trigger" : null;

  if (!typeId) {
    typeId = detectTypeFromFunctional(raw);
    if (typeId) typeSource = "functional";
  }

  // Scent without type → assume car perfume when scent or perfume-ish context
  if (!typeId && attrs.some((a) => a.startsWith("scent:"))) {
    typeId = "air_freshener";
    typeSource = "attribute_context";
  }

  // Conversation refinement: keep prior type/attrs unless overridden
  if (prior?.typeId && !typeId) {
    typeId = prior.typeId;
    typeSource = "history";
  }
  const mergedAttrs =
    attrs.length > 0 ? attrs : prior?.attributes?.length ? prior.attributes : [];

  const cheaper = REFINE_CHEAPER.some((p) =>
    normalizeText(raw).includes(normalizeText(p))
  );

  // Brand after explicit refine cues only — never "from freezing" etc.
  let brand = prior?.brand;
  const tokens = tokenizeQuery(raw);
  const brandHint = raw.match(
    /\b(?:vetëm|vetem|only|brand)\s+([A-Za-z][A-Za-z0-9][A-Za-z0-9\-]{0,22})\b/i
  );
  if (brandHint?.[1]) {
    const candidate = brandHint[1].trim();
    // Ignore common non-brand words accidentally captured
    const notBrand = new Set([
      "freezing",
      "winter",
      "cheaper",
      "this",
      "that",
      "these",
      "those",
      "products",
      "options",
      "makina",
      "makine",
      "vetura",
      "kerr",
    ]);
    if (!notBrand.has(normalizeText(candidate))) {
      brand = candidate;
    }
  }

  // Residual tokens — drop type/attr lexicon terms
  const lexicon = new Set(
    [
      ...TYPE_GROUPS.flatMap((g) => g.terms),
      ...ATTRIBUTE_GROUPS.flatMap((g) => g.terms),
      ...REFINE_CHEAPER,
    ].map((t) => normalizeText(t))
  );
  const residualTokens = tokens.filter((t) => {
    if (lexicon.has(t)) return false;
    if ([...lexicon].some((l) => l.includes(t) && t.length >= 4)) return false;
    return t.length >= 2;
  });

  const parsed: ParsedQuery = {
    typeId,
    attributes: mergedAttrs,
    brand,
    preferCheaper: cheaper || prior?.preferCheaper,
    residualTokens,
    retrievalQueries: [],
    typeSource,
  };
  parsed.retrievalQueries = buildRetrievalQueries(parsed, raw);
  return parsed;
}

/**
 * Evaluate one catalogue product against parsed intent.
 * Attribute requirements must be evidenced in name/description to be confirmed.
 */
export function evaluateProduct(
  product: RankableProduct,
  parsed: ParsedQuery,
  baseScore: number,
  baseReasons: MatchReason[],
  locale: "sq" | "en" = "sq"
): ProductEvaluation {
  const confirmedAttributes: string[] = [];
  const missingAttributes: string[] = [];

  if (parsed.typeId && !productMatchesType(product, parsed.typeId, locale)) {
    return {
      confidence: "none",
      score: 0,
      reasons: baseReasons,
      confirmedAttributes,
      missingAttributes: parsed.attributes,
    };
  }

  for (const attr of parsed.attributes) {
    if (productHasAttribute(product, attr, locale)) {
      confirmedAttributes.push(attr);
    } else {
      missingAttributes.push(attr);
    }
  }

  if (parsed.brand) {
    const brandN = normalizeText(product.brand);
    const want = normalizeText(parsed.brand);
    if (!brandN.includes(want) && !want.includes(brandN)) {
      return {
        confidence: "none",
        score: 0,
        reasons: baseReasons,
        confirmedAttributes,
        missingAttributes,
      };
    }
  }

  let score = baseScore;
  const reasons = new Set<MatchReason>(baseReasons);

  // Description-backed attribute hits are strong evidence
  if (confirmedAttributes.length) {
    score += 220 * confirmedAttributes.length;
    reasons.add("description");
    reasons.add("name");
  }

  // Required attributes missing → cannot be a confirmed match
  if (missingAttributes.length > 0) {
    // Keep as partial only if type matched and no attrs confirmed —
    // but NEVER present as exact scent match. For AI results we drop these.
    return {
      confidence: "partial",
      score: Math.floor(score * 0.35),
      reasons: [...reasons],
      confirmedAttributes,
      missingAttributes,
    };
  }

  if (parsed.typeId) {
    score += 80;
    reasons.add("category");
  }

  return {
    confidence: "confirmed",
    score,
    reasons: [...reasons],
    confirmedAttributes,
    missingAttributes,
  };
}

/** Back-compat wrappers used by older call sites. */
export type ProductIntent = {
  id: string;
  triggers: string[];
  mustMatch: string[];
  categories?: string[];
  exclude?: string[];
};

export function detectProductIntent(query: string): ProductIntent | null {
  const parsed = parseCustomerQuery(query);
  if (!parsed.typeId) return null;
  return {
    id: parsed.typeId,
    triggers: typeTerms(parsed.typeId),
    mustMatch: TYPE_EVIDENCE[parsed.typeId] ?? [],
    categories: TYPE_EVIDENCE[parsed.typeId]?.slice(0, 2),
    exclude: TYPE_EXCLUDE[parsed.typeId],
  };
}

export function productMatchesIntent(
  product: RankableProduct,
  intent: ProductIntent,
  locale: "sq" | "en" = "sq"
): boolean {
  return productMatchesType(product, intent.id, locale);
}

export function passesStrictRelevance(
  score: number,
  reasons: MatchReason[],
  product: RankableProduct,
  intent: ProductIntent | null,
  locale: "sq" | "en",
  opts?: { minScore?: number; parsed?: ParsedQuery }
): boolean {
  const minScore = opts?.minScore ?? 100;
  if (score < minScore) return false;

  const parsed =
    opts?.parsed ??
    (intent
      ? ({
          typeId: intent.id,
          attributes: [],
          residualTokens: [],
          retrievalQueries: [],
          typeSource: "trigger",
        } as ParsedQuery)
      : null);

  if (parsed?.typeId || (parsed?.attributes?.length ?? 0) > 0) {
    const ev = evaluateProduct(product, parsed!, score, reasons, locale);
    // Only confirmed matches when attributes were requested
    if (parsed!.attributes.length > 0) {
      return ev.confidence === "confirmed";
    }
    return ev.confidence === "confirmed" || ev.confidence === "partial";
  }

  const strong = reasons.some((r) =>
    ["sku", "code", "hidden_ref", "identifier", "name", "brand", "category"].includes(
      r
    )
  );
  if (reasons.length === 1 && reasons[0] === "fuzzy") return false;
  if (reasons.length === 1 && reasons[0] === "synonym") return false;
  return strong || (reasons.includes("synonym") && reasons.includes("name"));
}

export function intentSearchQueries(
  query: string,
  intent: ProductIntent | null
): string[] {
  const parsed = parseCustomerQuery(query);
  if (intent && !parsed.typeId) {
    parsed.typeId = intent.id;
  }
  return buildRetrievalQueries(parsed, query);
}

/** Sort helpers for cheaper refinement. */
export function sortByPriceAsc<T extends { sellingPrice?: number | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const pa = a.sellingPrice ?? Number.POSITIVE_INFINITY;
    const pb = b.sellingPrice ?? Number.POSITIVE_INFINITY;
    return pa - pb;
  });
}
