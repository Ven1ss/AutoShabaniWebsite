"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import CatalogueSearchTicket from "@/components/CatalogueSearchTicket";
import ProductCard from "@/components/ProductCard";
import {
  filterProducts,
  uniqueBrands,
  uniqueCategories,
  type Product,
} from "@/lib/products";
import { CONTACT } from "@/lib/contact";

const ease = [0.16, 1, 0.3, 1] as const;
const PREVIEW_COUNT = 10;

type Props = {
  products: Product[];
};

export default function CatalogueHero({ products }: Props) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [remoteMatches, setRemoteMatches] = useState<Product[] | null>(null);
  const [, startTransition] = useTransition();

  const brands = useMemo(() => uniqueBrands(products).slice(0, 8), [products]);
  const categories = useMemo(
    () => uniqueCategories(products).slice(0, 6),
    [products]
  );

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setRemoteMatches(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = (await res.json()) as Product[];
        setRemoteMatches(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setRemoteMatches(null);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const results = useMemo(() => {
    if (remoteMatches) return remoteMatches;
    if (query.trim()) {
      return filterProducts(products, { query, locale });
    }
    return products.slice(0, PREVIEW_COUNT);
  }, [products, remoteMatches, query, locale]);

  const searching = query.trim().length > 0;

  return (
    <section
      id="catalogue-teaser"
      className="relative pt-28 md:pt-32 pb-14 md:pb-20 bg-surface bg-surface-noise"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="max-w-3xl mb-8 md:mb-10"
        >
          <p className="font-ethnocentric text-lg sm:text-xl tracking-brand text-ink mb-4">
            {t.brandName}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold uppercase tracking-tight text-ink leading-[0.95] mb-4">
            {t.heroTitle}
          </h1>
          <p className="text-base md:text-lg text-ink-muted leading-relaxed max-w-xl">
            {t.heroSubtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="max-w-3xl mb-8"
        >
          <CatalogueSearchTicket
            value={query}
            onChange={(v) => startTransition(() => setQuery(v))}
            onSubmit={(v) => {
              if (v) router.push(`/katalogu?q=${encodeURIComponent(v)}`);
              else router.push("/katalogu");
            }}
            autoFocus
            size="hero"
          />
        </motion.div>

        {(brands.length > 0 || categories.length > 0) && (
          <div className="flex flex-col gap-3 mb-10 md:mb-12">
            {brands.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint mr-1">
                  {t.catalogueBrand}
                </span>
                {brands.map((b) => (
                  <Link
                    key={b}
                    href={`/katalogu?brand=${encodeURIComponent(b)}`}
                    className="font-mono text-xs px-2.5 py-1 border border-steel-light bg-surface-white text-ink hover:border-ink/40 transition-colors"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            ) : null}
            {categories.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint mr-1">
                  {t.catalogueCategory}
                </span>
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={`/katalogu?category=${encodeURIComponent(c)}`}
                    className="text-xs px-2.5 py-1 border border-steel-light/80 bg-surface-alt text-ink-muted hover:text-ink hover:border-ink/30 transition-colors"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <p className="text-sm text-ink-muted tabular-nums">
            {searching
              ? `${results.length} ${t.catalogueResults}`
              : t.catalogueFeatured}
          </p>
          <Link
            href="/katalogu"
            className="text-xs tracking-widest uppercase text-signal font-semibold hover:text-signal-deep transition-colors"
          >
            {t.catalogueBrowseAll} →
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {results.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center text-ink-muted border border-dashed border-steel-light"
            >
              {t.catalogueEmpty}
            </motion.p>
          ) : (
            <motion.ul
              key={searching ? `q-${query}` : "preview"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"
            >
              {results.slice(0, searching ? 15 : PREVIEW_COUNT).map((product, i) => (
                <motion.li
                  key={product.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(i, 10) * 0.025,
                    ease,
                  }}
                >
                  <ProductCard product={product} />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <p className="mt-10 text-sm text-ink-faint">
          {t.heroTradeNote}{" "}
          <a
            href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
              locale === "sq"
                ? "Përshëndetje, jam punishte / shumicë."
                : "Hello, I am a workshop / wholesale customer."
            )}`}
            className="text-ink underline underline-offset-2 hover:text-signal"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </p>
      </div>
    </section>
  );
}
