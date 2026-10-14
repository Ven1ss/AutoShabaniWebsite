/** Normalize free text for comparison (case, spaces, diacritics). */
export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize automotive identifiers (SKU / OE / barcode-like).
 * Strips spaces, hyphens, and other separators — does NOT map 0↔O.
 */
export function normalizeIdentifier(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function isIdentifierLike(token: string): boolean {
  const id = normalizeIdentifier(token);
  if (id.length < 5) return false;
  // Digit-heavy or mixed alphanumeric codes
  const digits = (id.match(/\d/g) ?? []).length;
  return digits >= 3 || (digits >= 2 && /[A-Z]/.test(id) && id.length >= 6);
}

/** Conversational filler — ignored for token fuzzy scoring. */
const QUERY_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "with",
  "from",
  "have",
  "has",
  "do",
  "does",
  "did",
  "you",
  "your",
  "i",
  "me",
  "my",
  "we",
  "need",
  "want",
  "looking",
  "look",
  "find",
  "please",
  "can",
  "could",
  "would",
  "is",
  "are",
  "of",
  "in",
  "on",
  "to",
  "kam",
  "kemi",
  "keni",
  "ka",
  "nevoje",
  "nevojë",
  "dua",
  "duam",
  "po",
  "per",
  "për",
  "nga",
  "me",
  "nje",
  "një",
  "disa",
  "kerkoj",
  "kërkoj",
  "kerkon",
  "kërkon",
  "gjej",
  "gjeni",
  "te",
  "të",
  "ju",
  "tuaj",
  "eshte",
  "është",
  "do",
  "mund",
  "mundeni",
]);

export function tokenizeQuery(query: string): string[] {
  return normalizeText(query)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 1 && !QUERY_STOPWORDS.has(t));
}

/** Drop chat filler so ranking focuses on part/brand/code tokens. */
export function significantQueryText(query: string): string {
  const tokens = tokenizeQuery(query);
  return tokens.join(" ").trim() || normalizeText(query);
}

export function compactText(value: string): string {
  return normalizeText(value).replace(/\s+/g, "");
}
