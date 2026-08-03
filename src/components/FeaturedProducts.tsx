"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import type { Product } from "@/lib/products";

const FEATURED_COUNT = 8;

type Props = {
  products: Product[];
};

/** Featured strip — same ProductCard as /katalogu. */
export default function FeaturedProducts({ products }: Props) {
  const { t } = useLanguage();
  const featured = products.slice(0, FEATURED_COUNT);

  if (featured.length === 0) return null;

  return (
    <section
      id="featured"
      className="relative py-12 sm:py-16 md:py-20 bg-surface bg-surface-noise"
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 mb-6 sm:mb-8 md:mb-10">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-signal font-semibold mb-2">
              {t.navCatalogue}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold uppercase tracking-tight text-ink">
              {t.catalogueFeatured}
            </h2>
          </div>
          <Link
            href="/katalogu"
            className="inline-flex min-h-11 items-center text-xs tracking-widest uppercase text-signal font-semibold hover:text-signal-deep transition-colors self-start sm:self-auto"
          >
            {t.catalogueBrowseAll} →
          </Link>
        </div>

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          {featured.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
