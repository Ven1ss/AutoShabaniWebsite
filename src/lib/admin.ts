import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildProductSlug } from "@/lib/slug";
import type { StockStatus } from "@/lib/supabase/database.types";

export type AdminProductInput = {
  id?: string;
  name: string;
  name_en?: string;
  sku: string;
  code?: string;
  brand?: string;
  description?: string;
  description_en?: string;
  category: string;
  image_url?: string;
  selling_price: number;
  purchase_price?: number;
  featured?: boolean;
  stock_status?: StockStatus;
  hidden_references?: string;
  slug?: string;
};

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { supabase: null, user: null, isAdmin: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    isAdmin: Boolean(profile?.is_admin),
  };
}

export function normalizeAdminProduct(input: AdminProductInput) {
  const slug =
    input.slug?.trim() ||
    buildProductSlug({ name: input.name, sku: input.sku, id: input.id });

  return {
    slug,
    name: input.name.trim(),
    name_en: input.name_en?.trim() || input.name.trim(),
    sku: input.sku.trim(),
    code: input.code?.trim() || null,
    brand: input.brand?.trim() || null,
    description: input.description?.trim() || "",
    description_en: input.description_en?.trim() || input.description?.trim() || "",
    category: input.category.trim(),
    image_url: input.image_url?.trim() || null,
    selling_price: Number(input.selling_price) || 0,
    purchase_price:
      input.purchase_price === undefined || input.purchase_price === null
        ? 0
        : Number(input.purchase_price),
    featured: Boolean(input.featured),
    stock_status: (input.stock_status || "on_request") as StockStatus,
    hidden_references: input.hidden_references?.trim() || "",
  };
}
