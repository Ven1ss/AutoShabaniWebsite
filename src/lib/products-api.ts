import { unstable_cache } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase/client";
import type {
  ProductPublicRow,
  StockStatus,
} from "@/lib/supabase/database.types";
import { isUuid } from "@/lib/slug";
import { resolveProductImageUrl, type Product } from "@/lib/products";

const LIST_COLUMNS_V2 =
  "id, slug, name, name_en, sku, code, brand, category, image_url, selling_price, featured, stock_status" as const;
const LIST_COLUMNS_V1 =
  "id, name, sku, code, brand, category, image_url, selling_price" as const;
const DETAIL_COLUMNS_V2 =
  "id, slug, name, name_en, sku, code, brand, description, description_en, category, image_url, selling_price, featured, stock_status" as const;
const DETAIL_COLUMNS_V1 =
  "id, name, sku, code, brand, description, category, image_url, selling_price" as const;

type ListRow = Partial<ProductPublicRow> & {
  id: string;
  name: string;
  sku: string;
  category: string;
};

function mapRow(row: ListRow, includeDescription = true): Product {
  const descriptionSq = includeDescription ? (row.description ?? "") : "";
  const descriptionEn = includeDescription
    ? (row.description_en ?? row.description ?? "")
    : "";
  return {
    id: row.id,
    slug: row.slug || row.id,
    sku: row.sku,
    code: row.code ?? "",
    name: {
      sq: row.name,
      en: row.name_en?.trim() ? row.name_en : row.name,
    },
    description: {
      sq: descriptionSq,
      en: descriptionEn,
    },
    brand: row.brand ?? "",
    category: row.category,
    image: resolveProductImageUrl(row.image_url),
    sellingPrice:
      row.selling_price === null || row.selling_price === undefined
        ? null
        : Number(row.selling_price),
    featured: Boolean(row.featured),
    stockStatus: (row.stock_status as StockStatus) || "on_request",
  };
}

/**
 * Slim catalogue list — skips description blobs for faster payloads.
 * Falls back to legacy columns if migration 001 is not applied yet.
 */
export async function getProducts(): Promise<Product[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    console.warn(
      "[products] Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return [];
  }

  const modern = await supabase
    .from("products_public")
    .select(LIST_COLUMNS_V2)
    .order("brand", { ascending: true })
    .order("name", { ascending: true });

  if (!modern.error && modern.data) {
    return modern.data
      .map((row) => mapRow(row, false))
      .sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  const legacy = await supabase
    .from("products_public")
    .select(LIST_COLUMNS_V1)
    .order("brand", { ascending: true })
    .order("name", { ascending: true });

  if (legacy.error) {
    console.error("[products] Failed to fetch products:", legacy.error.message);
    return [];
  }

  return (legacy.data ?? []).map((row) => mapRow(row, false));
}

/** Cached catalogue list for homepage / katalogu (ISR-friendly). */
export const getProductsCached = unstable_cache(
  async () => getProducts(),
  ["products-public-list-v3"],
  { revalidate: 120 }
);

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const products = await getProductsCached();
  const featured = products.filter((p) => p.featured);
  if (featured.length > 0) return featured.slice(0, limit);
  return products.slice(0, limit);
}

/**
 * Search by name, sku, code, brand, or hidden_references.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("search_products", {
    search_query: query.trim(),
  });

  if (error) {
    console.error("[products] Failed to search products:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row as ListRow, true));
}

async function fetchDetail(
  column: "slug" | "id",
  value: string
): Promise<Product | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const modern = await supabase
    .from("products_public")
    .select(DETAIL_COLUMNS_V2)
    .eq(column, value)
    .maybeSingle();

  if (!modern.error && modern.data) {
    return mapRow(modern.data, true);
  }

  if (column === "id" || isUuid(value)) {
    const legacy = await supabase
      .from("products_public")
      .select(DETAIL_COLUMNS_V1)
      .eq("id", value)
      .maybeSingle();

    if (legacy.error) {
      console.error(
        "[products] Failed to fetch product:",
        legacy.error.message
      );
      return null;
    }
    if (!legacy.data) return null;
    return mapRow(legacy.data, true);
  }

  return null;
}

/** Fetch a single product by SEO slug or UUID (legacy URLs). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const bySlug = await fetchDetail("slug", slug);
  if (bySlug) return bySlug;
  if (isUuid(slug)) return fetchDetail("id", slug);
  return null;
}

/** Cached product detail for PDP + metadata. */
export async function getProductBySlugCached(
  slug: string
): Promise<Product | null> {
  return unstable_cache(
    async () => getProductBySlug(slug),
    ["product-by-slug-v2", slug],
    { revalidate: 120 }
  )();
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const products = await getProductsCached();
  const sameBrand = products.filter(
    (p) =>
      p.id !== product.id &&
      p.brand &&
      product.brand &&
      p.brand.toLowerCase() === product.brand.toLowerCase()
  );
  const sameCategory = products.filter(
    (p) =>
      p.id !== product.id &&
      p.category === product.category &&
      !sameBrand.some((b) => b.id === p.id)
  );
  return [...sameBrand, ...sameCategory].slice(0, limit);
}

export async function getRelatedProductsCached(
  product: Product,
  limit = 4
): Promise<Product[]> {
  return unstable_cache(
    async () => getRelatedProducts(product, limit),
    ["related-products-v1", product.id, String(limit)],
    { revalidate: 120 }
  )();
}

export async function getAllProductSlugs(): Promise<
  { slug: string; updatedAt?: string }[]
> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const modern = await supabase
    .from("products_public")
    .select("id, slug, updated_at");

  if (!modern.error && modern.data) {
    return modern.data.map((row) => ({
      slug: (row as { slug?: string; id: string }).slug || row.id,
      updatedAt: (row as { updated_at?: string }).updated_at,
    }));
  }

  const legacy = await supabase.from("products_public").select("id");
  if (legacy.error) {
    console.error("[products] Failed to list slugs:", legacy.error.message);
    return [];
  }
  return (legacy.data ?? []).map((row) => ({ slug: row.id }));
}
