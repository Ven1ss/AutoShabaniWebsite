import { unstable_cache } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase/client";

export type RatingSummary = {
  average: number;
  count: number;
};

export async function getRatingStatsMap(): Promise<Record<string, RatingSummary>> {
  const supabase = createSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("product_rating_stats")
    .select("product_id, average, count");

  if (error) {
    console.error("[ratings] stats:", error.message);
    return {};
  }

  const map: Record<string, RatingSummary> = {};
  for (const row of data ?? []) {
    map[row.product_id] = {
      average: Number(row.average ?? 0),
      count: Number(row.count ?? 0),
    };
  }
  return map;
}

export const getRatingStatsMapCached = unstable_cache(
  async () => getRatingStatsMap(),
  ["product-rating-stats-v1"],
  { revalidate: 120 }
);
