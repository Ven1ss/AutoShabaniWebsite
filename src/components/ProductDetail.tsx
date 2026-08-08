"use client";

import { useEffect, useId, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import AddToCartButton from "@/components/AddToCartButton";
import ProductEnquiry from "@/components/ProductEnquiry";
import {
  getProductRating,
  type ProductRatingRecord,
} from "@/lib/product-ratings";
import {
  formatPrice,
  getLocalized,
  isProductCategory,
  resolveProductImageUrl,
  type Product,
} from "@/lib/products";

const ProductRating = dynamic(() => import("@/components/ProductRating"), {
  loading: () => (
    <div className="h-24 animate-pulse rounded-card border border-steel-light bg-as-snow" />
  ),
});

const DESCRIPTION_COLLAPSE_CHARS = 280;

type Props = {
  product: Product;
};

export default function ProductDetail({ product }: Props) {
  const { t, locale } = useLanguage();
  const zoomTitleId = useId();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const [rating, setRating] = useState<ProductRatingRecord>({
    average: 0,
    count: 0,
    userRating: null,
  });
  const name = getLocalized(product.name, locale);
  const description = getLocalized(product.description, locale);
  const categoryLabel = isProductCategory(product.category)
    ? t[`cat_${product.category}`]
    : product.category;
  const price = formatPrice(product.sellingPrice, locale);
  const imageSrc = resolveProductImageUrl(product.image);
  const descriptionNeedsToggle =
    description.trim().length > DESCRIPTION_COLLAPSE_CHARS;

  useEffect(() => {
    setRating(getProductRating(product.slug));
  }, [product.slug]);

  useEffect(() => {
    if (!imageZoomOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setImageZoomOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [imageZoomOpen]);

  return (
    <article className="overflow-x-hidden pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.25rem))] pb-[clamp(3rem,2rem+4vw,7rem)]">
      <div className="mx-auto w-full max-w-wide px-[var(--page-pad-x)]">
        <Link
          href="/katalogu"
          className="inline-flex min-h-11 items-center gap-2 text-caption uppercase tracking-wider text-as-secondary hover:text-as-dark transition-colors mb-[clamp(1rem,0.6rem+1.5vw,2.5rem)]"
        >
          <span aria-hidden>←</span> {t.catalogueBack}
        </Link>

        {/*
          < md: image → buy box → description → rate
          ≥ md: image | buy box; description + rate under image
        */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--gap-lg)] items-start">
          {/* Image — fluid width tracks the column / viewport */}
          <div className="min-w-0 order-1 md:col-span-6 lg:col-span-7 md:col-start-1 md:row-start-1">
            <div
              className="mx-auto w-full md:mx-0"
              style={{
                maxWidth:
                  "min(100%, clamp(13.5rem, 42vw + 2rem, 36rem))",
              }}
            >
              {imageSrc ? (
                <button
                  type="button"
                  onClick={() => setImageZoomOpen(true)}
                  aria-label={t.productImageZoom}
                  className="group relative aspect-square w-full overflow-hidden rounded-media border border-steel-light bg-gradient-to-b from-as-white to-as-snow shadow-card cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Image
                    src={imageSrc}
                    alt={name}
                    fill
                    priority
                    sizes="(max-width: 768px) min(100vw, 22rem), (max-width: 1024px) 45vw, 55vw"
                    className="object-contain transition-transform duration-motion ease-apple group-hover:scale-[1.03]"
                    style={{ padding: "var(--media-pad)" }}
                  />
                  <span className="pointer-events-none absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-steel-light bg-as-white/90 text-as-secondary shadow-card opacity-90 transition-opacity group-hover:opacity-100">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM11 8v6M8 11h6"
                      />
                    </svg>
                  </span>
                </button>
              ) : (
                <div className="relative aspect-square w-full overflow-hidden rounded-media border border-steel-light bg-gradient-to-b from-as-white to-as-snow shadow-card">
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-sm tracking-widest uppercase text-as-gray px-4 text-center break-all">
                    {product.sku || "—"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buy box */}
          <div className="min-w-0 order-2 md:col-span-6 lg:col-span-5 md:col-start-7 lg:col-start-8 md:row-start-1 md:row-span-3 md:sticky md:top-[clamp(5rem,4rem+2vw,7rem)]">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-[clamp(0.75rem,0.5rem+0.8vw,1rem)]">
              {product.brand ? (
                <span className="text-caption uppercase tracking-[0.14em] text-as-gray">
                  {product.brand}
                </span>
              ) : null}
              {product.brand && categoryLabel ? (
                <span className="text-as-mist" aria-hidden>
                  ·
                </span>
              ) : null}
              {categoryLabel ? (
                <span className="text-caption uppercase tracking-[0.12em] text-accent font-medium break-words">
                  {categoryLabel}
                </span>
              ) : null}
            </div>

            <h1
              className="font-semibold tracking-[-0.03em] text-as-dark leading-[1.15] mb-3 break-words"
              style={{ fontSize: "var(--text-title)" }}
            >
              {name}
            </h1>

            <ProductRating
              productSlug={product.slug}
              compact
              record={rating}
            />

            <p
              className="font-semibold tracking-tight text-accent tabular-nums mb-[clamp(1rem,0.6rem+1.2vw,1.5rem)]"
              style={{ fontSize: "var(--text-price-lg)" }}
            >
              {price ?? t.cataloguePriceOnRequest}
            </p>

            <dl className="grid gap-[clamp(0.5rem,0.35rem+0.5vw,0.75rem)] mb-[clamp(1.25rem,0.75rem+1.5vw,2rem)] text-sm border-y border-steel-light py-[clamp(0.85rem,0.6rem+0.8vw,1.15rem)]">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 items-baseline min-w-0">
                <dt className="text-caption uppercase tracking-wider text-as-gray">
                  {t.catalogueSku}
                </dt>
                <dd className="font-mono text-as-dark break-all">{product.sku}</dd>
              </div>
              {product.code ? (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 items-baseline min-w-0">
                  <dt className="text-caption uppercase tracking-wider text-as-gray">
                    {t.catalogueCode}
                  </dt>
                  <dd className="font-mono text-as-dark break-all">
                    {product.code}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="space-y-3 mb-[clamp(1.25rem,0.75rem+1.5vw,2rem)]">
              <AddToCartButton product={product} size="lg" />
              <p className="text-sm text-as-gray leading-relaxed">
                {t.cartAddHint}
              </p>
            </div>

            <ProductEnquiry product={product} />
          </div>

          {description ? (
            <section className="min-w-0 order-3 md:col-span-6 lg:col-span-7 md:col-start-1 md:row-start-2">
              <h2 className="text-caption uppercase tracking-[0.16em] text-accent font-medium mb-3">
                {t.productDescription}
              </h2>
              <div className="border border-steel-light bg-as-white rounded-card p-[clamp(0.85rem,0.55rem+1vw,1.5rem)] overflow-hidden">
                <p
                  className={`text-sm text-as-secondary leading-relaxed whitespace-pre-wrap break-words ${
                    descriptionNeedsToggle && !descriptionExpanded
                      ? "line-clamp-6"
                      : ""
                  }`}
                >
                  {description}
                </p>
                {descriptionNeedsToggle ? (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((open) => !open)}
                    className="mt-3 text-sm font-medium text-accent hover:text-accent-deep transition-colors"
                  >
                    {descriptionExpanded
                      ? t.catalogueViewLess
                      : t.catalogueViewMore}
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="min-w-0 order-4 md:col-span-6 lg:col-span-7 md:col-start-1 md:row-start-3">
            <ProductRating
              productSlug={product.slug}
              record={rating}
              onRated={setRating}
            />
          </div>
        </div>
      </div>

      {imageZoomOpen && imageSrc ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={zoomTitleId}
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
        >
          <button
            type="button"
            aria-label={t.productImageZoomClose}
            className="absolute inset-0 bg-as-dark/70 backdrop-blur-[3px] cursor-zoom-out"
            onClick={() => setImageZoomOpen(false)}
          />
          <div className="relative z-10 flex h-full w-full max-h-[min(92vh,56rem)] max-w-[min(96vw,56rem)] flex-col">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <p
                id={zoomTitleId}
                className="min-w-0 truncate text-sm font-medium text-white/90"
              >
                {name}
              </p>
              <button
                type="button"
                onClick={() => setImageZoomOpen(false)}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label={t.productImageZoomClose}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-media bg-as-white shadow-card-hover">
              <Image
                src={imageSrc}
                alt={name}
                fill
                sizes="100vw"
                className="object-contain"
                style={{ padding: "clamp(1rem, 2vw, 2.5rem)" }}
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
