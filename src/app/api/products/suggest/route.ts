import { NextResponse } from "next/server";
import { suggestSearch } from "@/lib/search-service";

export const dynamic = "force-dynamic";

const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 120;

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

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const suggestions = await suggestSearch(q, { locale, limit: 8 });
  return NextResponse.json(
    { suggestions },
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=45",
      },
    }
  );
}
