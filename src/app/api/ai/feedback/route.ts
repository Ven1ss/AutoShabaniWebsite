import { NextResponse } from "next/server";
import { logSearchFeedback, type FeedbackSignal } from "@/lib/search-feedback";

export const dynamic = "force-dynamic";

const SIGNALS = new Set<FeedbackSignal>([
  "helpful",
  "not_helpful",
  "clicked_product",
  "corrected_query",
]);

/**
 * POST /api/ai/feedback — thumbs / click signals for AI search learning.
 */
export async function POST(request: Request) {
  let body: {
    eventId?: unknown;
    signal?: unknown;
    productId?: unknown;
    sessionId?: unknown;
    note?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signal = typeof body.signal === "string" ? body.signal : "";
  if (!SIGNALS.has(signal as FeedbackSignal)) {
    return NextResponse.json({ error: "Invalid signal" }, { status: 400 });
  }

  const ok = await logSearchFeedback({
    eventId: typeof body.eventId === "string" ? body.eventId : null,
    signal: signal as FeedbackSignal,
    productId: typeof body.productId === "string" ? body.productId : null,
    sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
    note: typeof body.note === "string" ? body.note : null,
  });

  return NextResponse.json(
    { ok },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
