"use client";

import { useEffect, useState } from "react";
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
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

  return (
    <article className="overflow-x-hidden pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-16 sm:pb-20 md:pb-28">
      <div className="container mx-auto w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-12">
        <Link
          href="/katalogu"
          className="inline-flex min-h-11 items-center gap-2 text-caption uppercase tracking-wider text-as-secondary hover:text-as-dark transition-colors mb-6 sm:mb-10"
        >
          <span aria-hidden>←</span> {t.catalogueBack}
        </Link>

        {/*
          Mobile order: image → buy box → description → rate
          Desktop: image | buy box; description + rate under image
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 xl:gap-14 items-start">
          {/* Image */}
          <div className="min-w-0 order-1 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <div className="relative aspect-square w-full overflow-hidden rounded-media border border-steel-light bg-gradient-to-b from-as-white to-as-snow shadow-card">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-6 sm:p-10 md:p-12"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-sm tracking-widest uppercase text-as-gray px-4 text-center break-all">
                  {product.sku || "—"}
                </div>
              )}
            </div>
          </div>

          {/* Buy box */}
          <div className="min-w-0 order-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-28">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-3 sm:mb-4">
              {product.brand ? (
                <span className="text-caption uppercase tracking-[0.14em] text-as-gray">
                  {product.brand}
                </span>
              ) : null}
              {product.brand && categoryLabel ? (
                <span className="text-as-mist hidden xs:inline" aria-hidden>
                  ·
                </span>
              ) : null}
              {categoryLabel ? (
                <span className="text-caption uppercase tracking-[0.12em] text-accent font-medium break-words">
                  {categoryLabel}
                </span>
              ) : null}
            </div>

            <h1 className="text-[clamp(1.5rem,5vw,2.5rem)] font-semibold tracking-[-0.03em] text-as-dark leading-[1.15] mb-3 break-words">
              {name}
            </h1>

            <ProductRating
              productSlug={product.slug}
              compact
              record={rating}
            />

            <p className="text-[1.5rem] sm:text-[2rem] font-semibold tracking-tight text-accent tabular-nums mb-5 sm:mb-6">
              {price ?? t.cataloguePriceOnRequest}
            </p>

            <dl className="grid gap-2.5 mb-6 sm:mb-8 text-sm border-y border-steel-light py-4">
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

            <div className="space-y-3 mb-6 sm:mb-8">
              <AddToCartButton product={product} size="lg" />
              <p className="text-sm text-as-gray leading-relaxed">
                {t.cartAddHint}
              </p>
            </div>

            <ProductEnquiry product={product} />
          </div>

          {/* Description under image on desktop; after buy box on mobile */}
          {description ? (
            <section className="min-w-0 order-3 lg:col-span-7 lg:col-start-1 lg:row-start-2">
              <h2 className="text-caption uppercase tracking-[0.16em] text-accent font-medium mb-3">
                {t.productDescription}
              </h2>
              <div className="border border-steel-light bg-as-white rounded-card p-4 sm:p-6 overflow-hidden">
                <p
                  className={`text-sm sm:text-[0.9375rem] text-as-secondary leading-relaxed whitespace-pre-wrap break-words ${
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

          <div className="min-w-0 order-4 lg:col-span-7 lg:col-start-1 lg:row-start-3">
            <ProductRating
              productSlug={product.slug}
              record={rating}
              onRated={setRating}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
