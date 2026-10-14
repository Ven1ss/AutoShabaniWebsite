import { NextResponse } from "next/server";
import { runProductSearch } from "@/lib/search-service";

export const dynamic = "force-dynamic";

/** Simple in-memory rate limit (per instance). */
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 90;

function allow(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_HITS;
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!allow(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const locale = searchParams.get("locale") === "en" ? "en" : "sq";
  const rich = searchParams.get("rich") === "1";
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "48", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 48;

  if (!q) {
    return NextResponse.json(rich ? { products: [], hits: [], meta: { query: "", expandedQueries: [], aiUsed: false, resultCount: 0, fallback: "rpc" } } : [], {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  }

  if (q.length > 120) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const result = await runProductSearch(q, { locale, limit });

  if (!rich) {
    // Backward-compatible array response for existing catalogue clients
    return NextResponse.json(result.products, {
      headers: {
        "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
      },
    });
  }

  return NextResponse.json(
    {
      products: result.products,
      hits: result.hits.map((h) => ({
        id: h.product.id,
        slug: h.product.slug,
        score: h.score,
        reasons: h.reasons,
      })),
      meta: result.meta,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
      },
    }
  );
}
