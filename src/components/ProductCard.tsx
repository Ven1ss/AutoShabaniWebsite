"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import Badge from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatPrice,
  getLocalized,
  isProductCategory,
  resolveProductImageUrl,
  type Product,
} from "@/lib/products";

type Props = {
  product: Product;
  /** Compact for dense grids */
  compact?: boolean;
  /** Eager-load image for LCP candidates */
  priority?: boolean;
};

/**
 * Shared product card — homepage featured + /katalogu use this only.
 */
export default function ProductCard({
  product,
  compact = false,
  priority = false,
}: Props) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const categoryLabel = isProductCategory(product.category)
    ? t[`cat_${product.category}`]
    : product.category;
  const price = formatPrice(product.sellingPrice, locale);
  const imageSrc = resolveProductImageUrl(product.image);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-steel-light bg-as-white transition-all duration-motion ease-apple sm:hover:-translate-y-1 sm:hover:shadow-card-hover [content-visibility:auto] [contain-intrinsic-size:auto_380px]">
      <Link
        href={`/katalogu/${product.slug}`}
        className="relative aspect-square overflow-hidden border-b border-steel-light bg-as-snow"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-contain transition-transform duration-motion-slow ease-apple sm:group-hover:scale-[1.04]"
            style={{
              padding: compact
                ? "clamp(0.65rem, 0.45rem + 0.7vw, 1.15rem)"
                : "clamp(0.75rem, 0.5rem + 0.9vw, 1.35rem)",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-caption uppercase tracking-wider text-as-gray">
            {product.sku || "—"}
          </div>
        )}
      </Link>

      <div
        className="flex flex-1 flex-col"
        style={{
          gap: compact ? "0.35rem" : "0.4rem",
          padding: compact
            ? "clamp(0.7rem, 0.5rem + 0.6vw, 1rem)"
            : "clamp(0.85rem, 0.6rem + 0.7vw, 1.15rem)",
        }}
      >
        <Link href={`/katalogu/${product.slug}`} className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption uppercase tracking-wider text-as-gray">
              {product.brand}
            </span>
            {!compact ? <Badge variant="neutral">{categoryLabel}</Badge> : null}
          </div>
          <h3
            className={`font-medium text-as-dark leading-snug line-clamp-2 ${
              compact ? "text-[0.9375rem] sm:text-body" : "text-body"
            }`}
          >
            {name}
          </h3>
          {!compact ? (
            <p className="text-caption text-as-gray truncate">
              {t.catalogueSku} {product.sku}
              {product.code ? ` · ${t.catalogueCode} ${product.code}` : ""}
            </p>
          ) : (
            <p className="text-caption text-as-gray truncate">{product.sku}</p>
          )}
        </Link>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <p className="text-price text-accent tabular-nums truncate">
            {price ?? t.cataloguePriceOnRequest}
          </p>
          <AddToCartButton product={product} compact />
        </div>
      </div>
    </article>
  );
}
