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

export type StockStatus = "in_stock" | "on_request" | "out_of_stock";

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
  id: string;
  /** SEO-friendly slug used in product URLs (UUID fallback supported). */
  slug: string;
  sku: string;
  code: string;
  name: LocaleText;
  description: LocaleText;
  brand: string;
  category: string;
  image: string;
  sellingPrice: number | null;
  featured: boolean;
  stockStatus: StockStatus;
  /** Optional on-hand quantity. null = not tracked. */
  stockQty: number | null;
  /** Optional aggregate rating for cards */
  ratingAverage?: number;
  ratingCount?: number;
};

/** Fields needed to decide if a product can be purchased / carted online. */
export type SellableProductFields = Pick<
  Product,
  "sellingPrice" | "stockStatus" | "stockQty"
>;

/**
 * Sellable when priced + in stock + (qty untracked or > 0).
 */
export function isSellableOnline(product: SellableProductFields): boolean {
  if (product.sellingPrice == null || !(product.sellingPrice > 0)) return false;
  if (product.stockStatus !== "in_stock") return false;
  if (product.stockQty != null && product.stockQty <= 0) return false;
  return true;
}

const DEFAULT_MAX_QTY_PER_ORDER = 10;

/** Max quantity allowed for one cart line. */
export function maxOrderQty(
  product: Pick<SellableProductFields, "stockQty">,
  absoluteMax = 99
): number {
  const caps = [absoluteMax, DEFAULT_MAX_QTY_PER_ORDER];
  if (product.stockQty != null) caps.push(Math.max(0, product.stockQty));
  const max = Math.min(...caps);
  return Math.max(0, Math.floor(max));
}

export function whyNotSellableOnline(
  product: SellableProductFields
): "no_price" | "out_of_stock" | "on_request" | "no_qty" | null {
  if (product.sellingPrice == null || !(product.sellingPrice > 0)) {
    return "no_price";
  }
  if (product.stockStatus === "out_of_stock") return "out_of_stock";
  if (product.stockQty != null && product.stockQty <= 0) return "no_qty";
  if (product.stockStatus !== "in_stock") return "on_request";
  return null;
}

export function getLocalized(text: LocaleText, locale: "sq" | "en"): string {
  return text[locale] || text.sq || text.en;
}

/**
 * Next/Image throws on truthy but invalid `src` values (e.g. bare filenames).
 * Returns a usable local path / absolute http(s) URL, or "" when unusable.
 */
export function resolveProductImageUrl(
  value: string | null | undefined
): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    /* invalid absolute URL */
  }
  return "";
}

// Formatted by hand rather than with Intl: Node and browsers ship different
// locale data for sq-AL, so Intl produced a different string on the server than
// on the client and broke hydration.
export function formatPrice(
  amount: number | null,
  locale: "sq" | "en"
): string | null {
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
    if (opts.brand && opts.brand !== "all" && p.brand !== opts.brand)
      return false;
    if (opts.category && opts.category !== "all" && p.category !== opts.category)
      return false;
    if (!q) return true;
    return [p.sku, p.code, p.brand, p.name[locale], p.name.en, p.name.sq]
      .map(normalize)
      .some((field) => field.includes(q));
  });
}

export function uniqueBrands(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  );
}

export function uniqueCategories(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.category).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  );
}

export type ProductSort = "relevance" | "price-asc" | "price-desc" | "name";

export function sortProducts(
  products: Product[],
  sort: ProductSort,
  locale: "sq" | "en" = "sq"
): Product[] {
  const list = [...products];
  if (sort === "relevance") {
    return list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  if (sort === "name") {
    return list.sort((a, b) =>
      a.name[locale].localeCompare(
        b.name[locale],
        locale === "sq" ? "sq" : "en"
      )
    );
  }
  return list.sort((a, b) => {
    const pa = a.sellingPrice ?? Number.POSITIVE_INFINITY;
    const pb = b.sellingPrice ?? Number.POSITIVE_INFINITY;
    return sort === "price-asc" ? pa - pb : pb - pa;
  });
}

export function brandPath(brand: string): string {
  return `/katalogu/marka/${encodeURIComponent(slugifyBrand(brand))}`;
}

export function categoryPath(category: string): string {
  return `/katalogu/kategoria/${encodeURIComponent(slugifyBrand(category))}`;
}

export function slugifyBrand(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-._]/g, "");
}

export function matchBrandSlug(brand: string, slug: string): boolean {
  return slugifyBrand(brand) === slugifyBrand(decodeURIComponent(slug));
}

export function matchCategorySlug(category: string, slug: string): boolean {
  return slugifyBrand(category) === slugifyBrand(decodeURIComponent(slug));
}
