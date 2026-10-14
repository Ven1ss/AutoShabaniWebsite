/**
 * Extensible automotive synonym groups (Albanian / English / Kosovo usage).
 * Admins can extend via SEARCH_SYNONYMS_JSON env (JSON array of string arrays)
 * without redeploying code changes to the matcher itself.
 */

export type SynonymGroup = readonly string[];

/** Built-in groups — not universal equivalences; used only to expand queries. */
export const BUILTIN_SYNONYM_GROUPS: SynonymGroup[] = [
  ["filter i vajit", "filtri i vajit", "filtri vajit", "filter vajit", "oil filter"],
  ["filter i ajrit", "filtri i ajrit", "filtri ajrit", "filter ajrit", "air filter"],
  [
    "filter nafte",
    "filtri nafte",
    "filter i naftes",
    "filtri i naftes",
    "fuel filter",
    "diesel filter",
  ],
  [
    "filter kabine",
    "filtri kabines",
    "filter i kabines",
    "cabin filter",
    "pollen filter",
  ],
  ["feroda", "ferodat", "pllakat e frenave", "pllaka freni", "brake pads"],
  ["disqe freni", "disk freni", "brake disc", "brake disk"],
  [
    "jastuk motori",
    "jastëk motori",
    "mbajtese motori",
    "mbajtëse motori",
    "engine mount",
  ],
  ["amortizer", "amortizator", "shock absorber", "damper"],
  ["rrip dhëmbëzor", "rrip dhembezor", "timing belt"],
  ["rrip alternatori", "serpentine belt", "drive belt"],
  ["kushinetë", "kushineta", "bearing"],
  ["termostat", "thermostat"],
  ["pompë uji", "pompe uji", "water pump"],
  ["pompë karburanti", "pompe karburanti", "fuel pump"],
  ["buji", "bujia", "spark plug"],
  ["buji ndezjeje", "glow plug"],
  ["fllanxhë", "flanxhe", "gasket"],
  ["llambë", "llamba", "bulb", "lamp"],
  ["vaj motori", "motor oil", "engine oil"],
  ["antifriz", "coolant", "antifreeze"],
];

function loadExtraGroups(): SynonymGroup[] {
  const raw = process.env.SEARCH_SYNONYMS_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((g): g is string[] => Array.isArray(g) && g.every((x) => typeof x === "string"))
      .map((g) => g.map((s) => s.trim()).filter(Boolean));
  } catch {
    console.warn("[search] Invalid SEARCH_SYNONYMS_JSON — ignoring");
    return [];
  }
}

let cachedGroups: SynonymGroup[] | null = null;

export function getSynonymGroups(): SynonymGroup[] {
  if (!cachedGroups) {
    cachedGroups = [...BUILTIN_SYNONYM_GROUPS, ...loadExtraGroups()];
  }
  return cachedGroups;
}

/** Test helper — reset env-loaded cache. */
export function resetSynonymCache() {
  cachedGroups = null;
}

/**
 * Expand a query with synonym alternatives for matched phrases.
 * Returns original query plus expanded variants (deduped).
 */
export function expandQueryWithSynonyms(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const out = new Set<string>([query.trim()]);
  const compact = q.replace(/\s+/g, " ");

  for (const group of getSynonymGroups()) {
    const norms = group.map((s) => s.toLowerCase());
    const hit = norms.find(
      (term) =>
        compact === term ||
        compact.includes(` ${term} `) ||
        compact.startsWith(`${term} `) ||
        compact.endsWith(` ${term}`) ||
        compact.includes(term.replace(/\s+/g, ""))
    );
    if (!hit) continue;

    for (const alt of norms) {
      if (alt === hit) continue;
      // Replace phrase (space-aware) and compacted form
      const replaced = compact
        .split(hit)
        .join(alt)
        .replace(/\s+/g, " ")
        .trim();
      if (replaced) out.add(replaced);
      const compactHit = hit.replace(/\s+/g, "");
      const compactAlt = alt.replace(/\s+/g, "");
      if (compactHit.length >= 4 && compact.includes(compactHit)) {
        out.add(compact.split(compactHit).join(compactAlt).trim());
      }
    }
  }

  return [...out].filter(Boolean).slice(0, 8);
}
