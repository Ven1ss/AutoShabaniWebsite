/**
 * Curated homepage category chips — links that work against live catalogue
 * queries (DB categories are free-form strings).
 */

export type PopularCategory = {
  id: string;
  /** Catalogue search query */
  q: string;
  labelKey:
    | "popCatAntifreeze"
    | "popCatOil"
    | "popCatFilters"
    | "popCatBrakes"
    | "popCatFresheners"
    | "popCatRims"
    | "popCatLeather"
    | "popCatWipers";
};

export const POPULAR_CATEGORIES: PopularCategory[] = [
  { id: "antifreeze", q: "antifriz", labelKey: "popCatAntifreeze" },
  { id: "oil", q: "vaj motori", labelKey: "popCatOil" },
  { id: "filters", q: "filter", labelKey: "popCatFilters" },
  { id: "brakes", q: "feroda", labelKey: "popCatBrakes" },
  { id: "fresheners", q: "arome", labelKey: "popCatFresheners" },
  { id: "rims", q: "fellne", labelKey: "popCatRims" },
  { id: "leather", q: "lekure", labelKey: "popCatLeather" },
  { id: "wipers", q: "shporta", labelKey: "popCatWipers" },
];
