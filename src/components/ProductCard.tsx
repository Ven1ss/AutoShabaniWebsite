"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatPrice,
  getLocalized,
  isProductCategory,
  type Product,
} from "@/lib/products";

type Props = {
  product: Product;
};

/**
 * Shared catalogue card — used on homepage featured strip and /katalogu grid.
 */
export default function ProductCard({ product }: Props) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const categoryLabel = isProductCategory(product.category)
    ? t[`cat_${product.category}`]
    : product.category;
  const price = formatPrice(product.sellingPrice, locale);

  return (
    <div className="h-full">
      <Link
        href={`/katalogu/${product.slug}`}
        className="group flex h-full flex-col border border-steel-light/90 bg-surface-white transition-[border-color,box-shadow,transform] duration-300 active:bg-surface-ticket sm:hover:-translate-y-0.5 sm:hover:border-ink/30 sm:hover:shadow-[0_10px_28px_-16px_rgba(22,26,32,0.35)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-ticket border-b border-steel-light/70">
          {product.image ? (
            <Image
              src={product.image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-3 sm:p-4 md:p-5 transition-transform duration-500 ease-out sm:group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] sm:text-[11px] tracking-widest uppercase text-ink-faint px-2 text-center">
              {product.sku || "—"}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.12em] uppercase text-ink-faint truncate max-w-[55%]">
              {product.brand}
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.12em] uppercase text-signal font-semibold truncate max-w-[40%] text-right">
              {categoryLabel}
            </span>
          </div>
          <h3 className="font-display text-sm sm:text-base md:text-lg font-semibold uppercase tracking-tight text-ink leading-snug line-clamp-2">
            {name}
          </h3>
          <dl className="hidden sm:block font-mono text-[11px] text-ink-muted space-y-0.5">
            <div className="flex gap-2">
              <dt className="text-ink-faint shrink-0">{t.catalogueSku}</dt>
              <dd className="truncate">{product.sku}</dd>
            </div>
            {product.code ? (
              <div className="flex gap-2">
                <dt className="text-ink-faint shrink-0">{t.catalogueCode}</dt>
                <dd className="truncate">{product.code}</dd>
              </div>
            ) : null}
          </dl>
          <p className="sm:hidden font-mono text-[10px] text-ink-faint truncate">
            {product.sku}
          </p>
          <p className="mt-auto pt-1 font-mono text-sm font-semibold tabular-nums text-ink">
            {price ?? t.cataloguePriceOnRequest}
          </p>
          <span className="hidden sm:inline mt-1 pt-1 text-[11px] tracking-widest uppercase text-ink group-hover:text-signal transition-colors duration-300">
            {t.catalogueView} →
          </span>
        </div>
      </Link>
    </div>
  );
}
