import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json([]);
  }

  const products = await searchProducts(q);
  return NextResponse.json(products);
}
