"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatPrice,
  getLocalized,
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
  const price = formatPrice(product.sellingPrice, locale);
  const imageSrc = resolveProductImageUrl(product.image);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-steel-light bg-as-white transition-shadow duration-motion ease-apple sm:hover:shadow-card [content-visibility:auto] [contain-intrinsic-size:auto_380px]">
      <Link
        href={`/katalogu/${product.slug}`}
        className="relative aspect-square overflow-hidden border-b border-steel-light bg-[linear-gradient(180deg,#fafafa_0%,#f0f0f2_100%)]"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-contain p-3 sm:p-3.5 transition-transform duration-motion-slow ease-apple sm:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-caption text-as-gray">
            {product.sku || "—"}
          </div>
        )}
      </Link>

      <div
        className={`flex flex-1 flex-col ${
          compact ? "gap-1 p-3" : "gap-1.5 p-3.5 sm:p-4"
        }`}
      >
        <Link
          href={`/katalogu/${product.slug}`}
          className="flex flex-col gap-1 min-w-0"
        >
          {product.brand ? (
            <span className="text-caption text-as-gray truncate">
              {product.brand}
            </span>
          ) : null}
          <h3
            className={`font-medium text-as-dark leading-snug line-clamp-2 ${
              compact ? "text-sm sm:text-[0.9375rem]" : "text-body"
            }`}
          >
            {name}
          </h3>
          <p className="text-caption text-as-gray truncate">{product.sku}</p>
        </Link>

        <div className="mt-auto pt-2.5 flex items-end justify-between gap-2">
          <p className="text-[1.05rem] sm:text-price font-semibold text-accent tabular-nums truncate leading-none">
            {price ?? t.cataloguePriceOnRequest}
          </p>
          <AddToCartButton product={product} compact />
        </div>
      </div>
    </article>
  );
}
