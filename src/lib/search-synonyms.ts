/**
 * Extensible automotive synonym groups (Albanian / English / Kosovo usage).
 * Admins can extend via SEARCH_SYNONYMS_JSON env (JSON array of string arrays)
 * without redeploying code changes to the matcher itself.
 */

export type SynonymGroup = readonly string[];

/** Built-in groups — not universal equivalences; used only to expand queries. */
export const BUILTIN_SYNONYM_GROUPS: SynonymGroup[] = [
  [
    "filter i vajit",
    "filtri i vajit",
    "filtri vajit",
    "filter vajit",
    "filter vaji",
    "filtri vaji",
    "oil filter",
  ],
  [
    "filter i ajrit",
    "filtri i ajrit",
    "filtri ajrit",
    "filter ajrit",
    "filter ajri",
    "filtri ajri",
    "air filter",
  ],
  [
    "filter nafte",
    "filtri nafte",
    "filter i naftes",
    "filtri i naftes",
    "filter naftes",
    "fuel filter",
    "diesel filter",
  ],
  [
    "filter kabine",
    "filtri kabines",
    "filter i kabines",
    "filtri kabine",
    "cabin filter",
    "pollen filter",
  ],
  [
    "feroda",
    "ferodat",
    "ferode",
    "feroda frenash",
    "pllakat e frenave",
    "pllaka freni",
    "pllaka frenash",
    "brake pads",
    "brake pad",
  ],
  ["disqe freni", "disk freni", "disqet e frenave", "brake disc", "brake disk"],
  [
    "jastuk motori",
    "jastëk motori",
    "mbajtese motori",
    "mbajtëse motori",
    "engine mount",
  ],
  ["amortizer", "amortizator", "amortizere", "shock absorber", "damper"],
  ["rrip dhëmbëzor", "rrip dhembezor", "rrip dhembezor", "timing belt"],
  ["rrip alternatori", "serpentine belt", "drive belt"],
  ["kushinetë", "kushineta", "kushineta", "bearing"],
  ["termostat", "thermostat"],
  ["pompë uji", "pompe uji", "pompa e ujit", "water pump"],
  ["pompë karburanti", "pompe karburanti", "pompa e naftes", "fuel pump"],
  ["buji", "bujia", "bujitë", "spark plug"],
  ["buji ndezjeje", "glow plug"],
  ["fllanxhë", "flanxhe", "flanxha", "gasket"],
  ["llambë", "llamba", "llampa", "bulb", "lamp"],
  [
    "vaj motori",
    "vaj motor",
    "vaj per motor",
    "motor oil",
    "engine oil",
    "5w30",
    "5w-30",
    "10w40",
    "10w-40",
  ],
  [
    "antifriz",
    "antifrix",
    "antifreez",
    "coolant",
    "antifreeze",
    "engine coolant",
    "radiator coolant",
    "leng ftohje",
    "lëng ftohje",
    "ftohje motori",
    "uje per radiator",
    "ujë për radiator",
    "uje radiator",
  ],
  [
    "shporta",
    "shportat",
    "shporta fshirëse",
    "wiper",
    "wipers",
    "wiper blade",
    "wiper blades",
  ],
  ["ambrejazh", "ambreiazh", "clutch", "kit ambrejazhi"],
  ["pezullim", "suspension", "trapece", "trapezë"],

  [
    "aroma",
    "arome",
    "arom",
    "aromatizues",
    "freskues ajri",
    "air freshener",
    "car perfume",
    "car freshener",
    "parfum makine",
    "parfum per kerr",
    "parfum veture",
  ],
  [
    "strawberry",
    "luleshtrydhe",
    "luleshtrydheje",
    "dredhez",
    "dredheza",
    "dredhëz",
  ],
  ["lemon", "limon", "limoni"],
  ["cherry", "qershi", "qershia"],
  [
    "leather cleaner",
    "pastrues i lekures",
    "pastrues lekure",
    "leather care",
    "karriga te lekures",
    "maintain leather seats",
  ],
  [
    "pastrues per fellne",
    "pastrues fellne",
    "pastrues i fellneve",
    "pastrues fellnave",
    "pastrues fellnev",
    "rim cleaner",
    "wheel cleaner",
    "roton",
    "neorim",
  ],
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
