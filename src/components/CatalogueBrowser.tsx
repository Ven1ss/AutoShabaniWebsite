"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import CatalogueSearchTicket from "@/components/CatalogueSearchTicket";
import ProductCard from "@/components/ProductCard";
import {
  filterProducts,
  isProductCategory,
  sortProducts,
  uniqueBrands,
  uniqueCategories,
  type Product,
  type ProductSort,
} from "@/lib/products";

const ease = [0.16, 1, 0.3, 1] as const;

type Props = {
  products: Product[];
};

export default function CatalogueBrowser({ products }: Props) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "all");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [sort, setSort] = useState<ProductSort>("relevance");
  const [remoteMatches, setRemoteMatches] = useState<Product[] | null>(null);

  const brands = useMemo(() => uniqueBrands(products), [products]);
  const categories = useMemo(() => uniqueCategories(products), [products]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const b = searchParams.get("brand") ?? "all";
    const c = searchParams.get("category") ?? "all";
    setQuery(q);
    setBrand(b);
    setCategory(c);
  }, [searchParams]);

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
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function syncUrl(next: { q?: string; brand?: string; category?: string }) {
    const params = new URLSearchParams();
    const q = (next.q ?? query).trim();
    const b = next.brand ?? brand;
    const c = next.category ?? category;
    if (q) params.set("q", q);
    if (b && b !== "all") params.set("brand", b);
    if (c && c !== "all") params.set("category", c);
    const qs = params.toString();
    router.replace(qs ? `/katalogu?${qs}` : "/katalogu", { scroll: false });
  }

  const filtered = useMemo(() => {
    const base = remoteMatches
      ? filterProducts(remoteMatches, { brand, category, locale })
      : filterProducts(products, { query, brand, category, locale });
    return sortProducts(base, sort, locale);
  }, [products, remoteMatches, query, brand, category, locale, sort]);

  const resultsKey = `${query}|${brand}|${category}|${sort}|${filtered
    .map((p) => p.slug)
    .join(",")}`;

  const fieldClass =
    "w-full border border-steel-light bg-surface-white px-3 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink/30 focus:shadow-[0_0_0_3px_rgba(22,26,32,0.06)]";

  return (
    <div>
      <div className="mb-8 md:mb-10">
        <CatalogueSearchTicket
          value={query}
          onChange={(v) => {
            startTransition(() => setQuery(v));
          }}
          onSubmit={(v) => {
            startTransition(() => {
              setQuery(v);
              syncUrl({ q: v });
            });
          }}
          size="bar"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
            {t.catalogueBrand}
          </span>
          <select
            value={brand}
            onChange={(e) => {
              const value = e.target.value;
              startTransition(() => {
                setBrand(value);
                syncUrl({ brand: value });
              });
            }}
            className={fieldClass}
          >
            <option value="all">{t.catalogueAll}</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
            {t.catalogueCategory}
          </span>
          <select
            value={category}
            onChange={(e) => {
              const value = e.target.value;
              startTransition(() => {
                setCategory(value);
                syncUrl({ category: value });
              });
            }}
            className={fieldClass}
          >
            <option value="all">{t.catalogueAll}</option>
            {categories.map((key) => (
              <option key={key} value={key}>
                {isProductCategory(key) ? t[`cat_${key}`] : key}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
            {t.catalogueSort}
          </span>
          <select
            value={sort}
            onChange={(e) =>
              startTransition(() => setSort(e.target.value as ProductSort))
            }
            className={fieldClass}
          >
            <option value="relevance">{t.catalogueSortRelevance}</option>
            <option value="price-asc">{t.catalogueSortPriceAsc}</option>
            <option value="price-desc">{t.catalogueSortPriceDesc}</option>
            <option value="name">{t.catalogueSortName}</option>
          </select>
        </label>
      </div>

      <p className="font-mono text-sm text-ink-muted mb-6 tabular-nums">
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease }}
            className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"
          >
            {filtered.map((product, i) => (
              <motion.li
                key={product.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(i, 12) * 0.022,
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
