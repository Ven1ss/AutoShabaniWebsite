/**
 * Persist AI search events + customer feedback (service role only).
 */

import { createHash } from "crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type SearchEventInput = {
  query: string;
  locale: string;
  mode?: "ai" | "normal";
  intent?: string | null;
  attributes?: string[];
  resultIds?: string[];
  aiUsed?: boolean;
  sessionId?: string | null;
  ip?: string | null;
};

export type FeedbackSignal =
  | "helpful"
  | "not_helpful"
  | "clicked_product"
  | "corrected_query";

function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function logSearchEvent(
  input: SearchEventInput
): Promise<string | null> {
  const service = createServiceSupabaseClient();
  if (!service) return null;

  const { data, error } = await service
    .from("search_events")
    .insert({
      query: input.query.slice(0, 500),
      locale: input.locale || "sq",
      mode: input.mode ?? "ai",
      intent: input.intent ?? null,
      attributes: input.attributes ?? [],
      result_ids: input.resultIds ?? [],
      result_count: (input.resultIds ?? []).length,
      ai_used: Boolean(input.aiUsed),
      session_id: input.sessionId?.slice(0, 80) ?? null,
      ip_hash: hashIp(input.ip),
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[search-feedback] event:", error.message);
    return null;
  }
  return (data as { id?: string } | null)?.id ?? null;
}

export async function logSearchFeedback(opts: {
  eventId?: string | null;
  signal: FeedbackSignal;
  productId?: string | null;
  note?: string | null;
  sessionId?: string | null;
}): Promise<boolean> {
  const service = createServiceSupabaseClient();
  if (!service) return false;

  const { error } = await service.from("search_feedback").insert({
    event_id: opts.eventId || null,
    signal: opts.signal,
    product_id: opts.productId || null,
    note: opts.note?.slice(0, 400) || null,
    session_id: opts.sessionId?.slice(0, 80) || null,
  });

  if (error) {
    console.warn("[search-feedback] feedback:", error.message);
    return false;
  }
  return true;
}
