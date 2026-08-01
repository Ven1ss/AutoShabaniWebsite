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

export default function ProductCard({ product }: Props) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const categoryLabel = isProductCategory(product.category)
    ? t[`cat_${product.category}`]
    : product.category;
  const price = formatPrice(product.sellingPrice, locale);

  return (
    <Link
      href={`/katalogu/${product.slug}`}
      className="group flex h-full flex-col border border-steel-light/80 bg-surface-white transition-colors hover:border-ink/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-white border-b border-steel-light/60">
        <Image
          src={product.image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-4 md:p-5 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-[11px] tracking-[0.2em] uppercase text-ink-faint">
            {product.brand}
          </span>
          <span className="text-[11px] tracking-[0.16em] uppercase text-signal font-semibold">
            {categoryLabel}
          </span>
        </div>
        <h3 className="font-display text-lg font-semibold uppercase tracking-tight text-ink leading-tight">
          {name}
        </h3>
        <p className="text-xs text-ink-muted">
          {t.catalogueSku}: {product.sku}
          {product.code ? ` · ${t.catalogueCode}: ${product.code}` : null}
        </p>
        <p className="text-base font-semibold text-ink">
          {price ?? t.cataloguePriceOnRequest}
        </p>
        <span className="mt-auto pt-2 text-xs tracking-widest uppercase text-ink group-hover:text-signal transition-colors">
          {t.catalogueView} →
        </span>
      </div>
    </Link>
  );
}
