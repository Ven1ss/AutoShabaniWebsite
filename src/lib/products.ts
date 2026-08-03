export type LocaleText = { sq: string; en: string };

export type ProductCategory =
  | "filters"
  | "brakes"
  | "engine"
  | "belts"
  | "bearings"
  | "lighting"
  | "clutch"
  | "suspension";

export const CATEGORY_KEYS: ProductCategory[] = [
  "filters",
  "brakes",
  "engine",
  "belts",
  "bearings",
  "lighting",
  "clutch",
  "suspension",
];

/** Public catalogue product — never includes purchase price or hidden references. */
export type Product = {
  id?: string;
  /** Database id used by the product detail route. */
  slug: string;
  sku: string;
  code: string;
  name: LocaleText;
  description: LocaleText;
  brand: string;
  category: string;
  image: string;
  sellingPrice: number | null;
};

export function getLocalized(text: LocaleText, locale: "sq" | "en"): string {
  return text[locale];
}

// Formatted by hand rather than with Intl: Node and browsers ship different
// locale data for sq-AL, so Intl produced a different string on the server than
// on the client and broke hydration.
export function formatPrice(amount: number | null, locale: "sq" | "en"): string | null {
  if (amount === null || Number.isNaN(amount)) return null;
  const value = amount.toFixed(2);
  return locale === "sq" ? `${value.replace(".", ",")} €` : `€${value}`;
}

export function isProductCategory(value: string): value is ProductCategory {
  return (CATEGORY_KEYS as string[]).includes(value);
}

export function filterProducts(
  products: Product[],
  opts: {
    query?: string;
    brand?: string;
    category?: string;
    locale?: "sq" | "en";
  }
): Product[] {
  const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();
  const q = normalize(opts.query ?? "");
  const locale = opts.locale ?? "sq";

  return products.filter((p) => {
    if (opts.brand && opts.brand !== "all" && p.brand !== opts.brand) return false;
    if (opts.category && opts.category !== "all" && p.category !== opts.category)
      return false;
    if (!q) return true;
    // Public-field fallback only. hidden_references are matched server-side.
    // Spaces are ignored so "xxxxx" matches "xxx xx".
    return [p.sku, p.code, p.brand, p.name[locale], p.name.en, p.name.sq]
      .map(normalize)
      .some((field) => field.includes(q));
  });
}

export function uniqueBrands(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.brand))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function uniqueCategories(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.category))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export type ProductSort = "relevance" | "price-asc" | "price-desc" | "name";

export function sortProducts(
  products: Product[],
  sort: ProductSort,
  locale: "sq" | "en" = "sq"
): Product[] {
  const list = [...products];
  if (sort === "relevance") return list;
  if (sort === "name") {
    return list.sort((a, b) =>
      a.name[locale].localeCompare(b.name[locale], locale === "sq" ? "sq" : "en")
    );
  }
  return list.sort((a, b) => {
    const pa = a.sellingPrice ?? Number.POSITIVE_INFINITY;
    const pb = b.sellingPrice ?? Number.POSITIVE_INFINITY;
    return sort === "price-asc" ? pa - pb : pb - pa;
  });
}
