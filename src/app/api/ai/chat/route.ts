import { NextResponse } from "next/server";
import { runAiChatTurn, type ChatMessage } from "@/lib/ai-chat";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 30;

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
 * POST /api/ai/chat — ChatGPT-style spare-parts assistant.
 * Grounded in Supabase products (incl. hidden_references for matching only).
 * Never returns hidden_references or purchase_price.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!allow(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { messages?: unknown; locale?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale = body.locale === "en" ? "en" : "sq";
  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMessage[] = rawMessages
    .filter(
      (m): m is { role: string; content: string } =>
        !!m &&
        typeof m === "object" &&
        (m as { role?: string }).role !== undefined &&
        typeof (m as { content?: unknown }).content === "string"
    )
    .filter(
      (m) => m.role === "user" || m.role === "assistant"
    )
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, 800),
    }))
    .slice(-10);

  if (messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const result = await runAiChatTurn({ messages, locale });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
