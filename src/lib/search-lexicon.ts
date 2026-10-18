/**
 * Automotive lexicon: product types, attributes (scents, grades, etc.),
 * functional phrases, and Albanian/English colloquial variants.
 */

export type LexemeGroup = {
  id: string;
  terms: string[];
};

/** Product-type groups — any term can signal the type. */
export const TYPE_GROUPS: LexemeGroup[] = [
  {
    id: "leather_care",
    terms: [
      "leather cleaner",
      "leather care",
      "leather seat",
      "leather seats",
      "maintain leather",
      "clean leather",
      "pastrues i lekures",
      "pastrues lekure",
      "lekure",
      "lëkure",
      "karriga te lekures",
      "karrige lekure",
      "set pastrimi per karriga",
      "auron",
      "letan",
    ],
  },
  {
    id: "rim_cleaner",
    terms: [
      "rim cleaner",
      "wheel cleaner",
      "alloy cleaner",
      "pastrues per fellne",
      "pastrues fellne",
      "pastrues i fellneve",
      "pastrues fellnave",
      "pastrues fellnev",
      "pastrues per felna",
      "pastrues felna",
      "fellne",
      "fellnev",
      "fellneve",
      "fellnave",
      "felna",
      "felne",
      "roton",
      "neorim",
      "rim",
      "rims",
      "wheels cleaner",
    ],
  },
  {
    id: "interior_cleaner",
    terms: [
      "interior cleaner",
      "dashboard cleaner",
      "plastic cleaner",
      "pastrues interiori",
      "pastrues plastike",
      "polo protectant",
    ],
  },
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
    // Avoid bare "sea" — matches inside "seats"
    terms: ["ocean", "oqeani", "oqean", "deti", "blue ocean"],
  },
  {
    id: "scent:bubblegum",
    terms: ["bubble gum", "bubblegum", "çamçakëz", "camcakez", "camçakëz"],
  },
  {
    id: "grade:g11",
    terms: ["g11", "g 11"],
  },
  {
    id: "grade:g12",
    terms: ["g12", "g12+", "g 12"],
  },
  {
    id: "grade:g13",
    terms: ["g13", "g 13"],
  },
];

/**
 * Functional / descriptive phrases → product type.
 * Matched against normalizeText() output (no diacritics).
 */
export const FUNCTIONAL_PATTERNS: {
  typeId: string;
  patterns: RegExp[];
}[] = [
  {
    typeId: "leather_care",
    patterns: [
      /leather\s+(seat|seats|cleaner|care|clean|maintain)/,
      /maintain\s+leather/,
      /clean(ing)?\s+leather/,
      /products?\s+to\s+maintain\s+leather/,
      /pastrues\s+(i\s+)?lekure/,
      /karrig[ae].{0,20}lekure/,
      /lekure.{0,20}(pastr|mirembaj|mirëmbaj)/,
    ],
  },
  {
    typeId: "rim_cleaner",
    patterns: [
      /pastrues?.{0,16}felln/,
      /pastrues?.{0,16}feln/,
      /felln.{0,16}pastr/,
      /rim\s+cleaner/,
      /wheel\s+cleaner/,
      /alloy\s+cleaner/,
      /clean(er|ing)?.{0,12}(rim|rims|wheel|wheels)/,
    ],
  },
  {
    typeId: "antifreeze",
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

/** Evidence terms that confirm a product belongs to a type (name/category). */
export const TYPE_EVIDENCE: Record<string, string[]> = {
  leather_care: [
    "lekure",
    "lëkure",
    "leather",
    "letan",
    "auron",
    "karriga te lekures",
  ],
  rim_cleaner: [
    "felln",
    "felna",
    "rim",
    "roton",
    "neorim",
    "alloy",
    "wheel",
  ],
  interior_cleaner: [
    "polo protectant",
    "pastrues",
    "plastika",
    "interiori",
    "dashboard",
  ],
  air_freshener: [
    "arome",
    "aroma",
    "aromatizues",
    "freskues",
    "perfume",
    "freshener",
    "parfum",
  ],
  antifreeze: ["antifriz", "antifreeze", "coolant", "ftohje"],
  engine_oil: ["vaj motori", "engine oil", "motor oil", "5w", "10w", "0w"],
  oil_filter: ["filtri vajit", "oil filter", "filter vaj"],
  air_filter: ["filtri ajrit", "air filter", "filter ajr"],
  brake_pads: ["ferod", "brake pad", "pllaka fren", "pllakat e fren"],
  brake_disc: ["disk fren", "disqe fren", "brake disc", "brake disk"],
};

/** Hard negatives per type. */
export const TYPE_EXCLUDE: Record<string, string[]> = {
  leather_care: [
    "arome",
    "aroma",
    "cayon",
    "vento",
    "roko",
    "freshener",
    "parfum",
    "perfume",
    "scent",
    "antifriz",
    "brake caliper",
    "dpf",
    "aditiv",
  ],
  rim_cleaner: [
    "arome",
    "aroma",
    "cayon",
    "vento",
    "roko",
    "oya",
    "freshener",
    "parfum",
    "perfume",
    "cola",
    "kola",
    "antifriz",
    "lekure",
    "leather",
    "ferod",
    "aditiv",
  ],
  interior_cleaner: ["arome", "antifriz", "ferod", "vaj motori"],
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
  air_freshener: [
    "antifriz",
    "coolant",
    "filtri",
    "ferod",
    "vaj motori",
    "pastrues",
    "protectant",
    "cleaner",
    "plastika",
    "interiori",
    "panel",
    "lekure",
    "leather",
    "letan",
    "auron",
    "felln",
    "felna",
    "rim",
    "roton",
    "neorim",
  ],
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
