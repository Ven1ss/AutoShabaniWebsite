"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <motion.div
      className="h-full"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/katalogu/${product.slug}`}
        className="group flex h-full flex-col border border-steel-light/90 bg-surface-white transition-[border-color,box-shadow] duration-300 hover:border-ink/30 hover:shadow-[0_10px_28px_-16px_rgba(22,26,32,0.35)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-ticket border-b border-steel-light/70">
          {product.image ? (
            <Image
              src={product.image}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
              className="object-contain p-4 md:p-5 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-widest uppercase text-ink-faint">
              {product.sku || "—"}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-faint">
              {product.brand}
            </span>
            <span className="text-[10px] tracking-[0.14em] uppercase text-signal font-semibold">
              {categoryLabel}
            </span>
          </div>
          <h3 className="font-display text-base md:text-lg font-semibold uppercase tracking-tight text-ink leading-snug">
            {name}
          </h3>
          <dl className="font-mono text-[11px] text-ink-muted space-y-0.5">
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
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-ink">
            {price ?? t.cataloguePriceOnRequest}
          </p>
          <span className="mt-auto pt-2 text-[11px] tracking-widest uppercase text-ink group-hover:text-signal transition-colors duration-300">
            {t.catalogueView} →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
