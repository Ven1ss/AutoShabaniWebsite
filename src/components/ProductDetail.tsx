"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import AddToCartButton from "@/components/AddToCartButton";
import ProductEnquiry from "@/components/ProductEnquiry";
import ProductRating from "@/components/ProductRating";
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
    <article className="pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-16 sm:pb-20 md:pb-28">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <Link
          href="/katalogu"
          className="inline-flex min-h-11 items-center gap-2 text-caption uppercase tracking-wider text-as-secondary hover:text-as-dark transition-colors mb-8 sm:mb-10"
        >
          <span aria-hidden>←</span> {t.catalogueBack}
        </Link>

        <div className="grid lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-14 items-start">
          <div className="lg:col-span-6 xl:col-span-7 space-y-8">
            <div className="relative aspect-square overflow-hidden rounded-media border border-steel-light bg-gradient-to-b from-as-white to-as-snow shadow-card">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-8 sm:p-12 md:p-14"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-sm tracking-widest uppercase text-as-gray">
                  {product.sku || "—"}
                </div>
              )}
            </div>

            {description ? (
              <section>
                <h2 className="text-caption uppercase tracking-[0.16em] text-accent font-medium mb-3">
                  {t.productDescription}
                </h2>
                <div className="border border-steel-light bg-as-white rounded-card p-5 sm:p-6">
                  <p
                    className={`text-sm sm:text-[0.9375rem] text-as-secondary leading-relaxed whitespace-pre-wrap ${
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

            <ProductRating
              productSlug={product.slug}
              record={rating}
              onRated={setRating}
            />
          </div>

          <div className="lg:col-span-6 xl:col-span-5 lg:sticky lg:top-28">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
              {product.brand ? (
                <span className="text-caption uppercase tracking-[0.16em] text-as-gray">
                  {product.brand}
                </span>
              ) : null}
              {product.brand && categoryLabel ? (
                <span className="text-as-mist" aria-hidden>
                  ·
                </span>
              ) : null}
              {categoryLabel ? (
                <span className="text-caption uppercase tracking-[0.14em] text-accent font-medium">
                  {categoryLabel}
                </span>
              ) : null}
            </div>

            <h1 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.03em] text-as-dark leading-[1.1] mb-3">
              {name}
            </h1>

            <ProductRating
              productSlug={product.slug}
              compact
              record={rating}
            />

            <p className="text-[1.75rem] sm:text-[2rem] font-semibold tracking-tight text-accent tabular-nums mb-6">
              {price ?? t.cataloguePriceOnRequest}
            </p>

            <dl className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm border-y border-steel-light py-4">
              <div className="flex items-baseline gap-2 min-w-0">
                <dt className="text-caption uppercase tracking-wider text-as-gray shrink-0">
                  {t.catalogueSku}
                </dt>
                <dd className="font-mono text-as-dark break-all">{product.sku}</dd>
              </div>
              {product.code ? (
                <div className="flex items-baseline gap-2 min-w-0">
                  <dt className="text-caption uppercase tracking-wider text-as-gray shrink-0">
                    {t.catalogueCode}
                  </dt>
                  <dd className="font-mono text-as-dark break-all">
                    {product.code}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="space-y-3 mb-8">
              <AddToCartButton product={product} size="lg" />
              <p className="text-sm text-as-gray leading-relaxed">
                {t.cartAddHint}
              </p>
            </div>

            <ProductEnquiry product={product} />
          </div>
        </div>
      </div>
    </article>
  );
}
