"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

const ease = [0.16, 1, 0.3, 1] as const;

type Props = {
  products: Product[];
};

export default function CatalogueTeaser({ products }: Props) {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="catalogue-teaser"
      ref={ref}
      className="relative py-20 md:py-28 bg-surface bg-surface-noise"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <motion.div
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease }}
        >
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.28em] uppercase text-signal font-semibold mb-4">
              {t.catalogueTeaserLabel}
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold uppercase tracking-tight text-ink mb-4">
              {t.catalogueTeaserTitle}
            </h2>
            <p className="text-base md:text-lg text-ink-muted leading-relaxed max-w-lg">
              {t.catalogueTeaserText}
            </p>
          </div>
          <Link
            href="/katalogu"
            className="inline-flex shrink-0 items-center gap-2 bg-signal hover:bg-signal-deep text-white text-sm font-semibold tracking-wider uppercase px-7 py-3.5 transition-colors duration-200 self-start md:self-auto"
          >
            {t.catalogueTeaserCta}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </motion.div>

        {products.length > 0 ? (
          <ul className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {products.map((product, i) => (
              <motion.li
                key={product.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.5,
                  delay: 0.08 + Math.min(i, 9) * 0.045,
                  ease,
                }}
              >
                <ProductCard product={product} />
              </motion.li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
