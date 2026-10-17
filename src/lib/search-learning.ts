/**
 * Promote lexicon/synonym candidates from search_events + feedback.
 * Does not invent products — only surfaces query patterns for admin review
 * or SEARCH_SYNONYMS_JSON updates.
 */

import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type SynonymPromotion = {
  query: string;
  intent: string | null;
  emptyCount: number;
  notHelpfulCount: number;
  suggestedGroup: string[];
};

/**
 * High-frequency empty or not-helpful AI queries → synonym group candidates.
 */
export async function suggestSynonymPromotions(opts?: {
  sinceDays?: number;
  minEmpty?: number;
}): Promise<SynonymPromotion[]> {
  const service = createServiceSupabaseClient();
  if (!service) return [];

  const sinceDays = opts?.sinceDays ?? 14;
  const minEmpty = opts?.minEmpty ?? 2;
  const since = new Date(
    Date.now() - sinceDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: events, error } = await service
    .from("search_events")
    .select("id, query, intent, result_count")
    .eq("mode", "ai")
    .gte("created_at", since)
    .limit(500);

  if (error || !events?.length) {
    if (error) console.warn("[search-learning]", error.message);
    return [];
  }

  const eventIds = (events as { id: string }[]).map((e) => e.id);
  const { data: feedback } = await service
    .from("search_feedback")
    .select("event_id, signal")
    .in("event_id", eventIds)
    .eq("signal", "not_helpful")
    .limit(500);

  const notHelpful = new Set(
    (feedback as { event_id: string }[] | null)?.map((f) => f.event_id) ?? []
  );

  type Acc = {
    query: string;
    intent: string | null;
    emptyCount: number;
    notHelpfulCount: number;
  };
  const byQuery = new Map<string, Acc>();

  for (const row of events as {
    id: string;
    query: string;
    intent: string | null;
    result_count: number;
  }[]) {
    const key = row.query.trim().toLowerCase();
    if (key.length < 3) continue;
    const cur = byQuery.get(key) ?? {
      query: row.query.trim(),
      intent: row.intent,
      emptyCount: 0,
      notHelpfulCount: 0,
    };
    if ((row.result_count ?? 0) === 0) cur.emptyCount += 1;
    if (notHelpful.has(row.id)) cur.notHelpfulCount += 1;
    if (row.intent && !cur.intent) cur.intent = row.intent;
    byQuery.set(key, cur);
  }

  const out: SynonymPromotion[] = [];
  for (const acc of byQuery.values()) {
    if (acc.emptyCount < minEmpty && acc.notHelpfulCount < minEmpty) continue;
    out.push({
      query: acc.query,
      intent: acc.intent,
      emptyCount: acc.emptyCount,
      notHelpfulCount: acc.notHelpfulCount,
      suggestedGroup: [acc.query, ...(acc.intent ? [acc.intent] : [])],
    });
  }

  return out
    .sort(
      (a, b) =>
        b.emptyCount + b.notHelpfulCount - (a.emptyCount + a.notHelpfulCount)
    )
    .slice(0, 40);
}
