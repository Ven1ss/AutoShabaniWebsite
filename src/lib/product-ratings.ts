const RATINGS_STORAGE_KEY = "auto-shabani-product-ratings";
const COMMENTS_STORAGE_KEY = "auto-shabani-product-comments";

export type ProductRatingRecord = {
  /** Average 1–5 */
  average: number;
  /** Total ratings counted */
  count: number;
  /** Current visitor's rating, if any */
  userRating: number | null;
};

export type ProductComment = {
  id: string;
  productSlug: string;
  authorId: string;
  authorName: string;
  text: string;
  rating: number | null;
  createdAt: string;
};

type RatingStore = Record<
  string,
  {
    sum: number;
    count: number;
    userRating: number | null;
  }
>;

type CommentStore = Record<string, ProductComment[]>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function clampStar(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function getProductRating(slug: string): ProductRatingRecord {
  const store = readJson<RatingStore>(RATINGS_STORAGE_KEY, {});
  const entry = store[slug];
  if (!entry || entry.count <= 0) {
    return { average: 0, count: 0, userRating: entry?.userRating ?? null };
  }
  return {
    average: entry.sum / entry.count,
    count: entry.count,
    userRating: entry.userRating,
  };
}

/** Set or update the current visitor's star rating for a product. */
export function setProductUserRating(
  slug: string,
  stars: number
): ProductRatingRecord {
  const rating = clampStar(stars);
  const store = readJson<RatingStore>(RATINGS_STORAGE_KEY, {});
  const prev = store[slug] ?? { sum: 0, count: 0, userRating: null };

  if (prev.userRating !== null) {
    store[slug] = {
      sum: prev.sum - prev.userRating + rating,
      count: prev.count,
      userRating: rating,
    };
  } else {
    store[slug] = {
      sum: prev.sum + rating,
      count: prev.count + 1,
      userRating: rating,
    };
  }

  writeJson(RATINGS_STORAGE_KEY, store);
  return getProductRating(slug);
}

export function getProductComments(slug: string): ProductComment[] {
  const store = readJson<CommentStore>(COMMENTS_STORAGE_KEY, {});
  const list = store[slug] ?? [];
  return [...list].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addProductComment(opts: {
  productSlug: string;
  authorId: string;
  authorName: string;
  text: string;
  rating?: number | null;
}): ProductComment {
  const text = opts.text.trim();
  if (!text) {
    throw new Error("Comment text is required");
  }
  if (!opts.authorId) {
    throw new Error("Login required to comment");
  }

  const comment: ProductComment = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    productSlug: opts.productSlug,
    authorId: opts.authorId,
    authorName: opts.authorName.trim() || "User",
    text,
    rating:
      opts.rating === null || opts.rating === undefined
        ? null
        : clampStar(opts.rating),
    createdAt: new Date().toISOString(),
  };

  const store = readJson<CommentStore>(COMMENTS_STORAGE_KEY, {});
  store[opts.productSlug] = [comment, ...(store[opts.productSlug] ?? [])];
  writeJson(COMMENTS_STORAGE_KEY, store);
  return comment;
}
