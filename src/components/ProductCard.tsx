"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized, type Product } from "@/lib/products";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const categoryKey = `cat_${product.category}` as const;
  const categoryLabel = t[categoryKey];

  return (
    <Link
      href={`/katalogu/${product.slug}`}
      className="group flex flex-col border border-steel-light/80 bg-surface-white transition-colors hover:border-ink/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
        <Image
          src={product.image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] tracking-[0.2em] uppercase text-ink-faint">
            {product.brand}
          </span>
          <span className="text-[11px] tracking-[0.16em] uppercase text-signal font-semibold">
            {categoryLabel}
          </span>
        </div>
        <h3 className="font-display text-xl md:text-2xl font-semibold uppercase tracking-tight text-ink leading-tight">
          {name}
        </h3>
        <p className="text-sm text-ink-muted">
          {t.catalogueSku}: {product.sku}
        </p>
        <span className="mt-auto pt-2 text-xs tracking-widest uppercase text-ink group-hover:text-signal transition-colors">
          {t.catalogueView} →
        </span>
      </div>
    </Link>
  );
}
