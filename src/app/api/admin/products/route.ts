import { NextResponse } from "next/server";
import { normalizeAdminProduct, requireAdmin } from "@/lib/admin";
import type { AdminProductInput } from "@/lib/admin";

export async function GET() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const modern = await supabase
    .from("products")
    .select(
      "id, slug, name, name_en, sku, code, brand, description, description_en, category, image_url, selling_price, purchase_price, featured, stock_status, stock_qty, hidden_references, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (!modern.error) {
    return NextResponse.json({ products: modern.data ?? [] });
  }

  const legacy = await supabase
    .from("products")
    .select(
      "id, slug, name, name_en, sku, code, brand, description, description_en, category, image_url, selling_price, purchase_price, featured, stock_status, hidden_references, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (legacy.error) {
    return NextResponse.json({ error: legacy.error.message }, { status: 500 });
  }

  return NextResponse.json({ products: legacy.data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as AdminProductInput;
  if (!body.name?.trim() || !body.sku?.trim() || !body.category?.trim()) {
    return NextResponse.json(
      { error: "name, sku, and category are required" },
      { status: 400 }
    );
  }

  const row = normalizeAdminProduct(body);
  if (!("slug" in row) || !row.slug) {
    return NextResponse.json(
      { error: "Failed to build product slug" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("products")
    .insert(row)
    .select("id, slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}

export async function PUT(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as AdminProductInput;
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const row = normalizeAdminProduct(body);
  const { data, error } = await supabase
    .from("products")
    .update(row)
    .eq("id", body.id)
    .select("id, slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
