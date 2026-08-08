import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  }

  const products = await searchProducts(q);
  return NextResponse.json(products, {
    headers: {
      // Short private cache helps repeat keystrokes feel instant.
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    },
  });
}
