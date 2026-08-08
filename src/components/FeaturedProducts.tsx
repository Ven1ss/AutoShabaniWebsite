"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/ui/SectionHeading";
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
    <section id="featured" className="surface-white section-pad">
      <div className="container-as">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12 md:mb-16">
          <SectionHeading
            eyebrow={t.navCatalogue}
            title={t.catalogueFeatured}
            align="left"
            className="mb-0"
          />
          <Link
            href="/katalogu"
            className="inline-flex min-h-11 items-center text-body font-medium text-accent hover:text-accent-deep transition-colors self-start sm:self-auto sm:mb-1"
          >
            {t.catalogueBrowseAll} →
          </Link>
        </div>

        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {featured.map((product, i) => (
            <li key={product.slug}>
              <ProductCard product={product} priority={i < 2} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
