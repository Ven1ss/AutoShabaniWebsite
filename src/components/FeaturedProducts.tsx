"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";
import type { Product } from "@/lib/products";

type Props = {
  products: Product[];
};

/** Featured strip — curated `featured` products, else first items. */
export default function FeaturedProducts({ products }: Props) {
  const { t } = useLanguage();
  const curated = products.filter((p) => p.featured);
  const featured = (curated.length > 0 ? curated : products).slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section id="featured" className="bg-as-white section-pad">
      <div className="container-as">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10 md:mb-12">
          <SectionHeading
            title={t.catalogueFeatured}
            align="left"
            className="mb-0"
          />
          <Link
            href="/katalogu"
            className="inline-flex min-h-11 items-center text-body font-medium text-as-dark underline underline-offset-4 decoration-as-mist hover:decoration-as-dark transition-colors self-start sm:self-auto sm:mb-1"
          >
            {t.catalogueBrowseAll}
          </Link>
        </div>

        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(0.65rem,0.4rem+1vw,1.25rem)]">
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
