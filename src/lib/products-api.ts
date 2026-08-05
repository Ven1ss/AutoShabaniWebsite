import { unstable_cache } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { ProductPublicRow } from "@/lib/supabase/database.types";
import { resolveProductImageUrl, type Product } from "@/lib/products";

function mapRow(row: ProductPublicRow): Product {
  return {
    id: row.id,
    slug: row.id,
    sku: row.sku,
    code: row.code ?? "",
    name: { sq: row.name, en: row.name },
    description: { sq: row.description, en: row.description },
    brand: row.brand,
    category: row.category,
    image: resolveProductImageUrl(row.image_url),
    sellingPrice:
      row.selling_price === null || row.selling_price === undefined
        ? null
        : Number(row.selling_price),
  };
}

/**
 * Fetch active products from the public view only.
 * purchase_price and hidden_references are never selected / returned.
 */
export async function getProducts(): Promise<Product[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    console.warn(
      "[products] Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return [];
  }

  const { data, error } = await supabase
    .from("products_public")
    .select(
      "id, name, sku, code, brand, description, category, image_url, selling_price"
    )
    .order("brand", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[products] Failed to fetch products:", error.message);
    return [];
  }

  return (data ?? []).map(mapRow);
}

/** Cached catalogue list for homepage / katalogu (ISR-friendly). */
export const getProductsCached = unstable_cache(
  async () => getProducts(),
  ["products-public-list"],
  { revalidate: 60 }
);

/**
 * Search by name, sku, code, brand, or hidden_references.
 * Returns public product fields only — never purchase_price or hidden_references.
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

  return (data ?? []).map(mapRow);
}

/** Fetch a single product by slug from the public view only. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products_public")
    .select(
      "id, name, sku, code, brand, description, category, image_url, selling_price"
    )
    .eq("id", slug)
    .maybeSingle();

  if (error) {
    console.error("[products] Failed to fetch product:", error.message);
    return null;
  }
  if (!data) return null;
  return mapRow(data);
}
