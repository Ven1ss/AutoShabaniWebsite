"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/ProductCard";
import {
  filterProducts,
  isProductCategory,
  uniqueBrands,
  uniqueCategories,
  type Product,
} from "@/lib/products";

const ease = [0.16, 1, 0.3, 1] as const;

type Props = {
  products: Product[];
};

export default function CatalogueBrowser({ products }: Props) {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [remoteMatches, setRemoteMatches] = useState<Product[] | null>(null);
  const [, startTransition] = useTransition();

  const brands = useMemo(() => uniqueBrands(products), [products]);
  const categories = useMemo(() => uniqueCategories(products), [products]);

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
        console.error("[catalogue] Remote search failed:", error);
        setRemoteMatches(null);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const filtered = useMemo(() => {
    if (remoteMatches) {
      return filterProducts(remoteMatches, { brand, category, locale });
    }
    return filterProducts(products, { query, brand, category, locale });
  }, [products, remoteMatches, query, brand, category, locale]);

  const resultsKey = `${query}|${brand}|${category}|${filtered.map((p) => p.slug).join(",")}`;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr] mb-10 md:mb-12">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] tracking-[0.2em] uppercase text-ink-faint">
            {t.catalogueSearch}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              startTransition(() => setQuery(value));
            }}
            placeholder={t.catalogueSearch}
            className="w-full border border-steel-light bg-surface-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink/30 focus:shadow-[0_0_0_3px_rgba(18,21,26,0.06)]"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] tracking-[0.2em] uppercase text-ink-faint">
            {t.catalogueBrand}
          </span>
          <select
            value={brand}
            onChange={(e) => {
              const value = e.target.value;
              startTransition(() => setBrand(value));
            }}
            className="w-full border border-steel-light bg-surface-white px-4 py-3 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink/30 focus:shadow-[0_0_0_3px_rgba(18,21,26,0.06)]"
          >
            <option value="all">{t.catalogueAll}</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] tracking-[0.2em] uppercase text-ink-faint">
            {t.catalogueCategory}
          </span>
          <select
            value={category}
            onChange={(e) => {
              const value = e.target.value;
              startTransition(() => setCategory(value));
            }}
            className="w-full border border-steel-light bg-surface-white px-4 py-3 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink/30 focus:shadow-[0_0_0_3px_rgba(18,21,26,0.06)]"
          >
            <option value="all">{t.catalogueAll}</option>
            {categories.map((key) => (
              <option key={key} value={key}>
                {isProductCategory(key) ? t[`cat_${key}`] : key}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-ink-muted mb-8 tabular-nums">
        {filtered.length} {t.catalogueResults}
      </p>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease }}
            className="py-16 text-center text-ink-muted border border-dashed border-steel-light"
          >
            {t.catalogueEmpty}
          </motion.p>
        ) : (
          <motion.ul
            key={resultsKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease }}
            className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5"
          >
            {filtered.map((product, i) => (
              <motion.li
                key={product.slug}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(i, 12) * 0.028,
                  ease,
                }}
              >
                <ProductCard product={product} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
