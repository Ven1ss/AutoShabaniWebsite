import type { Product } from "@/lib/products";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://autoshabani.com";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function productCanonicalPath(slug: string): string {
  return `/katalogu/${slug}`;
}

export function productCanonicalUrl(slug: string): string {
  return absoluteUrl(productCanonicalPath(slug));
}

export type GtinKind = "gtin8" | "gtin12" | "gtin13" | "gtin14";

export type InferredGtin = { kind: GtinKind; value: string };

function asGtin(raw: string | null | undefined): InferredGtin | null {
  const value = (raw ?? "").trim();
  if (!/^\d+$/.test(value)) return null;
  if (value.length === 8) return { kind: "gtin8", value };
  if (value.length === 12) return { kind: "gtin12", value };
  if (value.length === 13) return { kind: "gtin13", value };
  if (value.length === 14) return { kind: "gtin14", value };
  return null;
}

/** Use SKU first, then code — only when the value is a digit-only barcode. */
export function inferGtin(
  product: Pick<Product, "sku" | "code">
): InferredGtin | null {
  return asGtin(product.sku) ?? asGtin(product.code);
}

function primaryName(product: Product): string {
  return (product.name.sq || product.name.en || "").trim();
}

function alreadyIncludes(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Unique indexable title. Prefer sq name; append en name when it adds signal.
 * Skips missing parts; never keyword-stuffs.
 */
export function buildProductTitle(product: Product): string {
  const nameSq = (product.name.sq || "").trim();
  const nameEn = (product.name.en || "").trim();
  const name =
    nameSq ||
    nameEn ||
    "";
  const brand = product.brand.trim();
  const code = product.code.trim();
  const chunks: string[] = [];

  if (brand && !alreadyIncludes(name, brand)) chunks.push(brand);
  if (name) chunks.push(name);
  if (
    nameEn &&
    nameSq &&
    nameEn.toLowerCase() !== nameSq.toLowerCase() &&
    !alreadyIncludes(nameSq, nameEn) &&
    nameEn.length <= 48
  ) {
    chunks.push(`(${nameEn})`);
  }
  if (code && !alreadyIncludes(chunks.join(" "), code)) chunks.push(code);

  const gtin = inferGtin(product);
  if (gtin && !alreadyIncludes(chunks.join(" "), gtin.value)) {
    chunks.push(gtin.value);
  }

  const core = chunks.join(" ").replace(/\s+/g, " ").trim();
  return core ? `${core} | AUTO SHABANI` : "AUTO SHABANI";
}

function clip(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Prefer the real description; otherwise a short factual fallback. */
export function buildProductDescription(product: Product): string {
  const fromDb = (product.description.sq || product.description.en || "").trim();
  if (fromDb) {
    const brand = product.brand.trim();
    const code = product.code.trim();
    const suffixBits = [
      brand && !alreadyIncludes(fromDb, brand) ? brand : "",
      code && !alreadyIncludes(fromDb, code) ? `kod ${code}` : "",
      "Prishtinë",
      "AUTO SHABANI",
    ].filter(Boolean);
    return clip(`${fromDb} — ${suffixBits.join(" · ")}`);
  }

  const name = primaryName(product);
  const bits = [product.brand.trim(), name, product.code.trim(), product.sku.trim()]
    .filter(Boolean)
    .filter((part, i, arr) => arr.findIndex((x) => x.toLowerCase() === part.toLowerCase()) === i);

  const lead = bits.join(" · ");
  return clip(
    lead
      ? `${lead} — pjesë këmbimi në Prishtinë. Çmim me TVSH. AUTO SHABANI.`
      : "Pjesë këmbimi origjinale në Prishtinë — AUTO SHABANI."
  );
}

export function buildProductImageAlt(product: Product): string {
  const name = primaryName(product);
  const parts = [product.brand.trim(), name, product.code.trim()].filter(
    (part, i, arr) =>
      Boolean(part) &&
      arr.findIndex((x) => x.toLowerCase() === part.toLowerCase()) === i
  );
  return parts.join(" ").replace(/\s+/g, " ").trim() || name || product.sku || "AUTO SHABANI";
}

export function schemaAvailability(
  status: Product["stockStatus"]
): string {
  if (status === "in_stock") return "https://schema.org/InStock";
  if (status === "out_of_stock") return "https://schema.org/OutOfStock";
  return "https://schema.org/LimitedAvailability";
}

const INDEXABLE_PARAM_KEYS = new Set(["q", "brand", "category", "page", "sort"]);

export function catalogueHasIndexableParams(
  searchParams: Record<string, string | string[] | undefined>
): boolean {
  return Object.entries(searchParams).some(([key, raw]) => {
    if (key.startsWith("utm_")) {
      const v = Array.isArray(raw) ? raw[0] : raw;
      return Boolean(v && String(v).trim());
    }
    if (!INDEXABLE_PARAM_KEYS.has(key)) return false;
    const v = Array.isArray(raw) ? raw[0] : raw;
    return Boolean(v && String(v).trim());
  });
}
