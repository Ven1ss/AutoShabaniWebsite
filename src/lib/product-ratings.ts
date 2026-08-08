import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export type ProductRatingRecord = {
  average: number;
  count: number;
  userRating: number | null;
};

export type ProductComment = {
  id: string;
  productSlug: string;
  author: string;
  body: string;
  createdAt: string;
  pending?: boolean;
};

const empty: ProductRatingRecord = {
  average: 0,
  count: 0,
  userRating: null,
};

/** Load aggregate + current user's rating for a product id. */
export async function fetchProductRating(
  productId: string,
  userId?: string | null
): Promise<ProductRatingRecord> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return empty;

  const { data: stats } = await supabase
    .from("product_rating_stats")
    .select("average, count")
    .eq("product_id", productId)
    .maybeSingle();

  let userRating: number | null = null;
  if (userId) {
    const { data: mine } = await supabase
      .from("product_ratings")
      .select("rating")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();
    userRating = mine?.rating ?? null;
  }

  return {
    average: Number(stats?.average ?? 0),
    count: Number(stats?.count ?? 0),
    userRating,
  };
}

export async function upsertProductRating(
  productId: string,
  userId: string,
  rating: number
): Promise<ProductRatingRecord> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return empty;

  const { error } = await supabase.from("product_ratings").upsert(
    {
      product_id: productId,
      user_id: userId,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id,user_id" }
  );

  if (error) {
    console.error("[ratings]", error.message);
  }

  return fetchProductRating(productId, userId);
}

export async function fetchProductComments(
  productId: string
): Promise<ProductComment[]> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("product_comments")
    .select("id, product_id, body, author_name, approved, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[comments]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    productSlug: row.product_id,
    author: row.author_name,
    body: row.body,
    createdAt: row.created_at,
    pending: !row.approved,
  }));
}

export async function submitProductComment(opts: {
  productId: string;
  userId: string;
  authorName: string;
  body: string;
}): Promise<{ comment?: ProductComment; error?: string }> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return { error: "Not configured" };

  const { data, error } = await supabase
    .from("product_comments")
    .insert({
      product_id: opts.productId,
      user_id: opts.userId,
      author_name: opts.authorName,
      body: opts.body.trim(),
      approved: false,
    })
    .select("id, product_id, body, author_name, approved, created_at")
    .maybeSingle();

  if (error || !data) {
    return { error: error?.message ?? "Failed to post comment" };
  }

  return {
    comment: {
      id: data.id,
      productSlug: data.product_id,
      author: data.author_name,
      body: data.body,
      createdAt: data.created_at,
      pending: !data.approved,
    },
  };
}

/** Compatibility shims used by older call sites — prefer async fetch* APIs. */
export function getProductRating(_slug: string): ProductRatingRecord {
  return empty;
}

export function setProductUserRating(
  _slug: string,
  _rating: number
): ProductRatingRecord {
  return empty;
}

export function getProductComments(_slug: string): ProductComment[] {
  return [];
}

export function addProductComment(
  _slug: string,
  _input: { author: string; body: string }
): ProductComment {
  return {
    id: "local",
    productSlug: _slug,
    author: _input.author,
    body: _input.body,
    createdAt: new Date().toISOString(),
    pending: true,
  };
}
