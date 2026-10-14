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

export function tokenizeQuery(query: string): string[] {
  return normalizeText(query)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 1);
}

export function compactText(value: string): string {
  return normalizeText(value).replace(/\s+/g, "");
}
