import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("enquiry_orders")
    .select("id, channel, message, created_at, status, locale")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ orders: [], error: error.message });
  }

  return NextResponse.json({ orders: data ?? [] });
}
