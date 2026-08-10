/** Lightweight fuzzy helpers for catalogue search ranking. */

export function normalizeSearch(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

/** Tokenize query into meaningful chunks (SKU fragments, words). */
export function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[\s,/|;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1);
}

/**
 * Simple edit-distance for short strings (typo tolerance).
 * Returns true when distance <= maxDist.
 */
export function withinEditDistance(
  a: string,
  b: string,
  maxDist = 1
): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > maxDist) return false;
  if (a.length === 0 || b.length === 0) return Math.max(a.length, b.length) <= maxDist;

  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = temp;
    }
    if (Math.min(...prev) > maxDist) return false;
  }
  return prev[b.length] <= maxDist;
}

export function fieldMatchesQuery(
  field: string,
  query: string
): "exact" | "includes" | "fuzzy" | null {
  const f = normalizeSearch(field);
  const q = normalizeSearch(query);
  if (!q || !f) return null;
  if (f === q) return "exact";
  if (f.includes(q) || q.includes(f)) return "includes";
  const tokens = searchTokens(query);
  for (const token of tokens) {
    const nt = normalizeSearch(token);
    if (nt.length >= 3 && withinEditDistance(f.slice(0, nt.length + 1), nt, 1)) {
      return "fuzzy";
    }
    if (f.includes(nt)) return "includes";
  }
  return null;
}
