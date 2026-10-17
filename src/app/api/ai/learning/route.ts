import { NextResponse } from "next/server";
import { suggestSynonymPromotions } from "@/lib/search-learning";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/learning — synonym promotion candidates from usage feedback.
 * Protected by REINDEX_SECRET when set (same as reindex).
 */
export async function GET(request: Request) {
  const secret = process.env.REINDEX_SECRET?.trim();
  if (secret) {
    const provided =
      request.headers.get("x-reindex-secret")?.trim() ||
      new URL(request.url).searchParams.get("secret")?.trim();
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const promotions = await suggestSynonymPromotions();
  return NextResponse.json(
    { ok: true, promotions },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
