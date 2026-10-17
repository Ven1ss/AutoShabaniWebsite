import { NextResponse } from "next/server";
import { getAiCatalogueCached } from "@/lib/ai-catalogue";
import { reindexProductEmbeddings } from "@/lib/search-embeddings";
import { aiSearchEnabled } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/ai/reindex — embed / refresh product vectors (admin or cron).
 * Protected by REINDEX_SECRET header when set.
 */
export async function POST(request: Request) {
  const secret = process.env.REINDEX_SECRET?.trim();
  if (secret) {
    const provided = request.headers.get("x-reindex-secret")?.trim();
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!aiSearchEnabled()) {
    return NextResponse.json(
      { error: "AI provider not configured" },
      { status: 503 }
    );
  }

  const products = await getAiCatalogueCached();
  const result = await reindexProductEmbeddings(products, { limit: 120 });

  return NextResponse.json({
    ok: true,
    catalogueSize: products.length,
    ...result,
  });
}
