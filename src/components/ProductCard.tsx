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
  compact?: boolean;
  priority?: boolean;
};

function MiniStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-accent" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill={value >= n - 0.25 ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8 6.8 19.5l1-5.8L3.6 9.6l5.8-.8L12 3.5z" />
        </svg>
      ))}
    </span>
  );
}

export default function ProductCard({
  product,
  compact = false,
  priority = false,
}: Props) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const price = formatPrice(product.sellingPrice, locale);
  const imageSrc = resolveProductImageUrl(product.image);
  const hasRating = (product.ratingCount ?? 0) > 0;

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
            className="object-contain p-2.5 sm:p-3.5 transition-transform duration-motion-slow ease-apple sm:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-caption text-as-gray">
            {product.sku || "—"}
          </div>
        )}
      </Link>

      <div
        className={`flex flex-1 flex-col ${
          compact ? "gap-1 p-2.5 sm:p-3" : "gap-1.5 p-3 sm:p-4"
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
              compact ? "text-[0.8125rem] sm:text-sm" : "text-body"
            }`}
          >
            {name}
          </h3>
          <p className="text-caption text-as-gray truncate">{product.sku}</p>
          {hasRating ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <MiniStars value={product.ratingAverage ?? 0} />
              <span className="text-[11px] text-as-gray tabular-nums">
                {(product.ratingAverage ?? 0).toFixed(1)}
                <span className="text-as-mist"> · </span>
                {product.ratingCount}
              </span>
            </div>
          ) : null}
        </Link>

        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <p className="text-[0.95rem] sm:text-price font-semibold text-accent tabular-nums truncate leading-none">
            {price ?? t.cataloguePriceOnRequest}
          </p>
          <AddToCartButton product={product} compact />
        </div>
      </div>
    </article>
  );
}
