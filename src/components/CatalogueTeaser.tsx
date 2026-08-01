"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function CatalogueTeaser() {
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
          className="max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs tracking-[0.28em] uppercase text-signal font-semibold mb-4">
            {t.catalogueTeaserLabel}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold uppercase tracking-tight text-ink mb-5">
            {t.catalogueTeaserTitle}
          </h2>
          <p className="text-base md:text-lg text-ink-muted leading-relaxed mb-8 max-w-lg">
            {t.catalogueTeaserText}
          </p>
          <Link
            href="/katalogu"
            className="inline-flex items-center gap-2 bg-signal hover:bg-signal-deep text-white text-sm font-semibold tracking-wider uppercase px-7 py-3.5 transition-colors duration-200"
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
      </div>
    </section>
  );
}
