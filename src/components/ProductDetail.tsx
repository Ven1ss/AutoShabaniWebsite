"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ProductEnquiry from "@/components/ProductEnquiry";
import { getLocalized, type Product } from "@/lib/products";

type Props = {
  product: Product;
};

export default function ProductDetail({ product }: Props) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const description = getLocalized(product.description, locale);
  const fitment = getLocalized(product.fitment, locale);
  const categoryLabel = t[`cat_${product.category}`];

  return (
    <article className="pt-28 md:pt-32 pb-20 md:pb-28">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <Link
          href="/katalogu"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-ink-muted hover:text-ink transition-colors mb-10"
        >
          ← {t.catalogueBack}
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="relative aspect-[4/3] overflow-hidden border border-steel-light bg-surface-alt">
            <Image
              src={product.image}
              alt={name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-[11px] tracking-[0.2em] uppercase text-ink-faint">
                {product.brand}
              </span>
              <span className="text-[11px] tracking-[0.16em] uppercase text-signal font-semibold">
                {categoryLabel}
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold uppercase tracking-tight text-ink leading-tight mb-4">
              {name}
            </h1>
            <p className="text-sm text-ink-muted mb-6">
              {t.catalogueSku}: {product.sku}
            </p>
            <p className="text-base md:text-lg text-ink-muted leading-relaxed mb-8 max-w-xl">
              {description}
            </p>
            <div className="mb-10 pb-10 border-b border-steel-light">
              <p className="text-xs tracking-widest uppercase text-ink-faint mb-2">
                {t.catalogueFitment}
              </p>
              <p className="text-base text-ink">{fitment}</p>
            </div>
            <ProductEnquiry product={product} />
          </div>
        </div>
      </div>
    </article>
  );
}
