"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  addProductComment,
  getProductComments,
  getProductRating,
  setProductUserRating,
  type ProductComment,
  type ProductRatingRecord,
} from "@/lib/product-ratings";

type Props = {
  productSlug: string;
  /** Compact stars + count for the buy box */
  compact?: boolean;
  record?: ProductRatingRecord;
  onRated?: (next: ProductRatingRecord) => void;
};

function Stars({
  value,
  interactive,
  onSelect,
  size = "md",
}: {
  value: number;
  interactive?: boolean;
  onSelect?: (n: number) => void;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const starCls = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(0)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${value.toFixed(1)} / 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = display >= n;
        const half = !filled && display >= n - 0.5;
        const btn = (
          <svg key={n} className={starCls} viewBox="0 0 24 24" aria-hidden>
            <defs>
              {half ? (
                <linearGradient id={`half-${n}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              ) : null}
            </defs>
            <path
              fill={
                filled ? "currentColor" : half ? `url(#half-${n})` : "none"
              }
              stroke="currentColor"
              strokeWidth={1.5}
              d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8 6.8 19.5l1-5.8L3.6 9.6l5.8-.8L12 3.5z"
            />
          </svg>
        );

        if (!interactive || !onSelect) {
          return (
            <span key={n} className="text-accent">
              {btn}
            </span>
          );
        }

        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}`}
            className={`text-accent transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              filled || half ? "opacity-100" : "opacity-35"
            }`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => onSelect(n)}
          >
            {btn}
          </button>
        );
      })}
    </div>
  );
}

function formatCommentDate(iso: string, locale: "sq" | "en"): string {
  try {
    return new Intl.DateTimeFormat(locale === "sq" ? "sq-AL" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default function ProductRating({
  productSlug,
  compact = false,
  record: controlledRecord,
  onRated,
}: Props) {
  const { t, locale } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const [localRecord, setLocalRecord] = useState<ProductRatingRecord>({
    average: 0,
    count: 0,
    userRating: null,
  });
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [justRated, setJustRated] = useState(false);
  const [justCommented, setJustCommented] = useState(false);
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    setLocalRecord(getProductRating(productSlug));
    setComments(getProductComments(productSlug));
    setHydrated(true);
  }, [productSlug]);

  const record = controlledRecord ?? localRecord;

  function handleRate(stars: number) {
    const next = setProductUserRating(productSlug, stars);
    setLocalRecord(next);
    onRated?.(next);
    setJustRated(true);
  }

  function handleCommentSubmit(e: FormEvent) {
    e.preventDefault();
    setCommentError("");
    setJustCommented(false);

    if (!isLoggedIn || !user) {
      setCommentError(t.productCommentLoginRequired);
      return;
    }

    const text = commentText.trim();
    if (!text) return;

    try {
      const created = addProductComment({
        productSlug,
        authorId: user.id,
        authorName: user.name,
        text,
        rating: record.userRating,
      });
      setComments((prev) => [created, ...prev]);
      setCommentText("");
      setJustCommented(true);
    } catch {
      setCommentError(t.productCommentLoginRequired);
    }
  }

  if (compact) {
    if (!hydrated || record.count === 0) {
      return (
        <p className="text-sm text-as-gray mb-5">{t.productNoRatings}</p>
      );
    }
    return (
      <div className="flex items-center gap-2 mb-5">
        <Stars value={record.average} size="sm" />
        <span className="text-sm text-as-dark tabular-nums font-medium">
          {record.average.toFixed(1)}
        </span>
        <span className="text-sm text-as-gray">
          ({record.count} {t.productReviews})
        </span>
      </div>
    );
  }

  return (
    <section className="border border-steel-light bg-as-white p-5 sm:p-6 rounded-card space-y-6">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-caption uppercase tracking-[0.16em] text-accent font-medium mb-1">
              {t.productRate}
            </p>
            <h2 className="text-lg font-semibold text-as-dark tracking-tight">
              {t.productRateTitle}
            </h2>
          </div>
          {hydrated && record.count > 0 ? (
            <div className="text-right">
              <p className="text-2xl font-semibold text-as-dark tabular-nums leading-none">
                {record.average.toFixed(1)}
              </p>
              <p className="text-caption text-as-gray mt-1">
                {record.count} {t.productReviews}
              </p>
            </div>
          ) : null}
        </div>

        {hydrated && record.count > 0 ? (
          <div className="mb-5">
            <Stars value={record.average} size="sm" />
          </div>
        ) : (
          <p className="text-sm text-as-gray mb-5">{t.productNoRatings}</p>
        )}

        <div className="border-t border-steel-light pt-5">
          <p className="text-sm text-as-secondary mb-3">
            {record.userRating ? t.productYourRating : t.productRatePrompt}
          </p>
          <Stars
            value={record.userRating ?? 0}
            interactive
            onSelect={handleRate}
            size="md"
          />
          {justRated ? (
            <p className="mt-3 text-sm font-medium text-accent">
              {t.productRateThanks}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-steel-light pt-6">
        <h3 className="text-sm font-semibold text-as-dark mb-3">
          {t.productComment}
        </h3>

        {isLoggedIn && user ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <label className="sr-only" htmlFor={`comment-${productSlug}`}>
              {t.productComment}
            </label>
            <textarea
              id={`comment-${productSlug}`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t.productCommentPlaceholder}
              rows={3}
              maxLength={800}
              className="w-full resize-y border border-steel-light bg-as-snow px-3 py-2.5 text-sm text-as-dark placeholder:text-as-gray outline-none focus:border-accent transition-colors"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="inline-flex min-h-11 items-center justify-center bg-accent px-5 text-sm font-medium text-white hover:bg-accent-deep disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {t.productCommentSubmit}
              </button>
              {justCommented ? (
                <p className="text-sm font-medium text-accent">
                  {t.productCommentThanks}
                </p>
              ) : null}
              {commentError ? (
                <p className="text-sm text-accent">{commentError}</p>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <textarea
              disabled
              rows={3}
              placeholder={t.productCommentPlaceholder}
              className="w-full resize-none border border-steel-light bg-as-snow/70 px-3 py-2.5 text-sm text-as-gray placeholder:text-as-gray/80 cursor-not-allowed"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 items-center justify-center border border-steel-light bg-as-mist/50 px-5 text-sm font-medium text-as-secondary cursor-not-allowed"
              >
                {t.productCommentLoginCta}
              </button>
              <p className="text-sm text-as-gray">
                {t.productCommentLoginRequired}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-steel-light pt-6">
        <h3 className="text-sm font-semibold text-as-dark mb-4">
          {t.productCommentsTitle}
          {comments.length > 0 ? (
            <span className="ml-2 text-as-gray font-normal tabular-nums">
              ({comments.length})
            </span>
          ) : null}
        </h3>

        {comments.length === 0 ? (
          <p className="text-sm text-as-gray">{t.productNoComments}</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="border border-steel-light bg-as-snow/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-as-dark">
                    {comment.authorName}
                  </p>
                  <p className="text-caption text-as-gray">
                    {formatCommentDate(comment.createdAt, locale)}
                  </p>
                </div>
                {comment.rating ? (
                  <div className="mb-2">
                    <Stars value={comment.rating} size="sm" />
                  </div>
                ) : null}
                <p className="text-sm text-as-secondary leading-relaxed whitespace-pre-wrap">
                  {comment.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
