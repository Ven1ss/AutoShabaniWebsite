/**
 * Automotive lexicon: product types, attributes (scents, etc.), functional
 * phrases, and Albanian/English colloquial variants used for intent parsing.
 */

export type LexemeGroup = {
  id: string;
  /** Canonical English-ish id used in attributes. */
  terms: string[];
};

/** Product-type groups — any term can signal the type. */
export const TYPE_GROUPS: LexemeGroup[] = [
  {
    id: "air_freshener",
    terms: [
      "arome",
      "aroma",
      "arom",
      "aromatizues",
      "aromatizuese",
      "freskues",
      "freskues ajri",
      "air freshener",
      "car perfume",
      "car freshener",
      "parfum",
      "parfum makine",
      "parfum per kerr",
      "parfum per makin",
      "parfum veture",
      "parfum per veture",
      "perfume",
      "scent",
    ],
  },
  {
    id: "antifreeze",
    terms: [
      "antifriz",
      "antifreeze",
      "coolant",
      "engine coolant",
      "radiator coolant",
      "leng ftohje",
      "lëng ftohje",
      "ftohje motori",
      "uje radiator",
      "ujë radiator",
      "uje per radiator",
      "ujë për radiator",
      "uje per radiatori",
      "radiator water",
      "g11",
      "g12",
      "g13",
    ],
  },
  {
    id: "engine_oil",
    terms: [
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
  },
  {
    id: "oil_filter",
    terms: [
      "filtri vajit",
      "filter i vajit",
      "filtri i vajit",
      "filter vajit",
      "oil filter",
      "filter vaji",
    ],
  },
  {
    id: "air_filter",
    terms: [
      "filtri ajrit",
      "filter i ajrit",
      "filtri i ajrit",
      "air filter",
    ],
  },
  {
    id: "brake_pads",
    terms: [
      "feroda",
      "ferodat",
      "ferode",
      "brake pads",
      "brake pad",
      "pllakat e frenave",
      "pllaka freni",
      "pllaka frenash",
      "pllaka e frenave",
      "pllakat frenash",
    ],
  },
  {
    id: "brake_disc",
    terms: [
      "disqe freni",
      "disk freni",
      "disku i frenave",
      "brake disc",
      "brake disk",
    ],
  },
];

/** Attribute groups — must be verified in name or description when requested. */
export const ATTRIBUTE_GROUPS: LexemeGroup[] = [
  {
    id: "scent:strawberry",
    terms: [
      "strawberry",
      "luleshtrydhe",
      "luleshtrydheje",
      "lule shtrydhe",
      "dredhez",
      "dredheza",
      "dredhëz",
      "dredhza",
      "dredhëza",
    ],
  },
  {
    id: "scent:lemon",
    terms: ["lemon", "limon", "limoni", "limonit"],
  },
  {
    id: "scent:cherry",
    terms: ["cherry", "qershi", "qershia", "qershive"],
  },
  {
    id: "scent:cola",
    terms: ["cola", "kola"],
  },
  {
    id: "scent:ocean",
    terms: ["ocean", "oqeani", "oqean", "deti", "sea"],
  },
  {
    id: "scent:bubblegum",
    terms: ["bubble gum", "bubblegum", "çamçakëz", "camcakez", "camçakëz"],
  },
];

/**
 * Functional / descriptive phrases → product type.
 * Matched against normalized query text.
 */
export const FUNCTIONAL_PATTERNS: {
  typeId: string;
  patterns: RegExp[];
}[] = [
  {
    typeId: "antifreeze",
    // Patterns run on normalizeText() output (no diacritics).
    patterns: [
      /uje\s*(per)?\s*radiator/,
      /water\s*(for\s*)?radiator/,
      /(prevent|ndalon|pengon|mbroj).{0,48}(freez|ngrih|ngrir|nengrih)/,
      /(liquid|leng|lengu).{0,48}(winter|dimer|freez|ngrih)/,
      /engine.{0,36}freez/,
      /freez.{0,36}engine/,
      /from\s+freezing/,
      /nga\s+ngrirja/,
      /mos\s+te\s+ngrihet/,
    ],
  },
  {
    typeId: "air_freshener",
    patterns: [
      /(ere|ere e mire).{0,24}(makin|kerr|vetur)/,
      /(smell|scent|perfume).{0,24}(car|vehicle)/,
    ],
  },
];

/** Evidence terms that confirm a product belongs to a type (name/category/desc). */
export const TYPE_EVIDENCE: Record<string, string[]> = {
  air_freshener: [
    "arome",
    "aroma",
    "aromatizues",
    "freskues",
    "perfume",
    "freshener",
    "parfum",
    "scent",
  ],
  antifreeze: ["antifriz", "antifreeze", "coolant", "ftohje"],
  engine_oil: ["vaj motori", "engine oil", "motor oil", "5w", "10w", "0w"],
  oil_filter: ["filtri vajit", "oil filter", "filter vaj"],
  air_filter: ["filtri ajrit", "air filter", "filter ajr"],
  brake_pads: ["ferod", "brake pad", "pllaka fren", "pllakat e fren"],
  brake_disc: ["disk fren", "disqe fren", "brake disc", "brake disk"],
};

/** Hard negatives per type — products that share words but are wrong. */
export const TYPE_EXCLUDE: Record<string, string[]> = {
  antifreeze: [
    "arome",
    "aroma",
    "parfum",
    "perfume",
    "freshener",
    "klima fresh",
    "stop leak",
    "radiator flush",
    "pastrues i radiatorit",
    "ndalues i rrjedhjes",
  ],
  air_freshener: ["antifriz", "coolant", "filtri", "ferod", "vaj motori"],
  brake_pads: [
    "pastrues",
    "cleaner",
    "sprej ngjyre",
    "caliper paint",
    "vaj i frenav",
    "brake fluid",
    "dot-4",
    "dot 4",
    "mast per shtrafa",
    "wash pad",
  ],
  brake_disc: [
    "pastrues",
    "cleaner",
    "caliper paint",
    "brake fluid",
    "vaj i frenav",
  ],
};

/** Refinement phrases for multi-turn chat. */
export const REFINE_CHEAPER = [
  "cheaper",
  "cheapest",
  "më lirë",
  "me lire",
  "më të lira",
  "me te lira",
  "lirë",
  "lire",
  "inexpensive",
  "affordable",
];

export const REFINE_ONLY_BRAND = [
  "vetëm",
  "vetem",
  "only",
  "just",
  "nga",
  "from",
];
