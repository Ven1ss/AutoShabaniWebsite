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

export function formatPrice(amount: number | null, locale: "sq" | "en"): string | null {
  if (amount === null || Number.isNaN(amount)) return null;
  return new Intl.NumberFormat(locale === "sq" ? "sq-AL" : "en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
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
  const q = opts.query?.trim().toLowerCase() ?? "";
  const locale = opts.locale ?? "sq";

  return products.filter((p) => {
    if (opts.brand && opts.brand !== "all" && p.brand !== opts.brand) return false;
    if (opts.category && opts.category !== "all" && p.category !== opts.category)
      return false;
    if (!q) return true;
    const haystack = [
      p.sku,
      p.code,
      p.brand,
      p.category,
      p.name[locale],
      p.name.en,
      p.name.sq,
      p.description[locale],
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
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
