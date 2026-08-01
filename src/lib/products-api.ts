import { createSupabaseClient } from "@/lib/supabase/client";
import type { ProductRow } from "@/lib/supabase/database.types";
import {
  isProductCategory,
  type Product,
  type ProductCategory,
} from "@/lib/products";

function mapRow(row: ProductRow): Product | null {
  if (!isProductCategory(row.category)) return null;
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: { sq: row.name_sq, en: row.name_en },
    description: { sq: row.description_sq, en: row.description_en },
    brand: row.brand,
    category: row.category as ProductCategory,
    image: row.image_url,
    fitment: { sq: row.fitment_sq, en: row.fitment_en },
  };
}

/** Fetch all active products from Supabase. Returns [] if not configured or on error. */
export async function getProducts(): Promise<Product[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    console.warn(
      "[products] Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("brand", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) {
    console.error("[products] Failed to fetch products:", error.message);
    return [];
  }

  return (data ?? [])
    .map(mapRow)
    .filter((p): p is Product => p !== null);
}

/** Fetch a single active product by slug. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[products] Failed to fetch product:", error.message);
    return null;
  }
  if (!data) return null;
  return mapRow(data);
}
