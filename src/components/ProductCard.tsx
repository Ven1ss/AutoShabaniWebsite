"use client";

import Image from "next/image";
import Link from "next/link";
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
};

/**
 * Shared product card — homepage featured + /katalogu use this only.
 */
export default function ProductCard({ product, compact = false }: Props) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const categoryLabel = isProductCategory(product.category)
    ? t[`cat_${product.category}`]
    : product.category;
  const price = formatPrice(product.sellingPrice, locale);
  const imageSrc = resolveProductImageUrl(product.image);

  return (
    <Link
      href={`/katalogu/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-steel-light bg-as-white transition-all duration-motion ease-apple sm:hover:-translate-y-1 sm:hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden border-b border-steel-light bg-as-snow">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className={`object-contain transition-transform duration-motion-slow ease-apple sm:group-hover:scale-[1.04] ${
              compact ? "p-3 sm:p-4" : "p-4 sm:p-5"
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-caption uppercase tracking-wider text-as-gray">
            {product.sku || "—"}
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "gap-1 p-3" : "gap-1.5 p-4"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption uppercase tracking-wider text-as-gray">
            {product.brand}
          </span>
          {!compact ? <Badge variant="neutral">{categoryLabel}</Badge> : null}
        </div>
        <h3
          className={`font-medium text-as-dark leading-snug line-clamp-2 ${
            compact ? "text-sm" : "text-body"
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
        <p className="mt-auto pt-2 text-price text-accent tabular-nums">
          {price ?? t.cataloguePriceOnRequest}
        </p>
      </div>
    </Link>
  );
}
