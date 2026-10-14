import { NextResponse } from "next/server";
import { runAiFind } from "@/lib/ai-find";

export const dynamic = "force-dynamic";

/** Simple in-memory rate limit (per instance). */
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 40;

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

/**
 * POST /api/ai/find — Autodekor-Buli-style "Gjej pjesën" finder.
 * Body: { q: string, locale?: "sq"|"en" }
 * Returns catalogue products only; never invents fitment.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!allow(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { q?: unknown; locale?: unknown; limit?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const q = typeof body.q === "string" ? body.q.trim() : "";
  if (!q) {
    return NextResponse.json(
      { intro: "", items: [], meta: { query: "", aiUsed: false, resultCount: 0 } },
      { status: 200 }
    );
  }
  if (q.length > 120) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const locale = body.locale === "en" ? "en" : "sq";
  const limitRaw =
    typeof body.limit === "number"
      ? body.limit
      : Number.parseInt(String(body.limit ?? "8"), 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 8;

  const result = await runAiFind(q, { locale, limit });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
