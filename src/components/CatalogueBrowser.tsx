"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type Props = {
  products: Product[];
};

function ChevronIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-as-gray"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="m6 9 6 6 6-6"
      />
    </svg>
  );
}

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

  function clearFilters() {
    startTransition(() => {
      setBrand("all");
      setCategory("all");
      setSort("relevance");
      syncUrl({ brand: "all", category: "all" });
    });
  }

  const filtered = useMemo(() => {
    const base = remoteMatches
      ? filterProducts(remoteMatches, { brand, category, locale })
      : filterProducts(products, { query, brand, category, locale });
    return sortProducts(base, sort, locale);
  }, [products, remoteMatches, query, brand, category, locale, sort]);

  const hasActiveFilters =
    brand !== "all" || category !== "all" || sort !== "relevance";

  const categoryLabel =
    category === "all"
      ? t.catalogueAll
      : isProductCategory(category)
        ? t[`cat_${category}`]
        : category;

  const selectClass =
    "peer w-full min-h-11 appearance-none rounded-md border border-steel-light bg-as-white pl-3 pr-10 text-base text-as-dark outline-none transition-[border-color,box-shadow] duration-motion-fast ease-apple hover:border-as-gray/50 focus:border-as-dark/30 focus:shadow-[0_0_0_3px_rgba(29,29,31,0.06)]";

  const labelClass = "text-sm text-as-secondary";

  return (
    <div>
      <div className="mb-[clamp(1rem,0.6rem+1.5vw,2.5rem)]">
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

      <div className="mb-[clamp(1rem,0.6rem+1.2vw,2rem)] overflow-hidden rounded-xl border border-steel-light bg-as-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-steel-light">
          <label className="relative flex flex-col gap-1.5 p-3 sm:p-4">
            <span className={labelClass}>{t.catalogueBrand}</span>
            <div className="relative">
              <select
                value={brand}
                onChange={(e) => {
                  const value = e.target.value;
                  startTransition(() => {
                    setBrand(value);
                    syncUrl({ brand: value });
                  });
                }}
                className={selectClass}
                aria-label={t.catalogueBrand}
              >
                <option value="all">{t.catalogueAll}</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </label>

          <label className="relative flex flex-col gap-1.5 p-3 sm:p-4">
            <span className={labelClass}>{t.catalogueCategory}</span>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => {
                  const value = e.target.value;
                  startTransition(() => {
                    setCategory(value);
                    syncUrl({ category: value });
                  });
                }}
                className={selectClass}
                aria-label={t.catalogueCategory}
              >
                <option value="all">{t.catalogueAll}</option>
                {categories.map((key) => (
                  <option key={key} value={key}>
                    {isProductCategory(key) ? t[`cat_${key}`] : key}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </label>

          <label className="relative flex flex-col gap-1.5 p-3 sm:p-4">
            <span className={labelClass}>{t.catalogueSort}</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) =>
                  startTransition(() => setSort(e.target.value as ProductSort))
                }
                className={selectClass}
                aria-label={t.catalogueSort}
              >
                <option value="relevance">{t.catalogueSortRelevance}</option>
                <option value="price-asc">{t.catalogueSortPriceAsc}</option>
                <option value="price-desc">{t.catalogueSortPriceDesc}</option>
                <option value="name">{t.catalogueSortName}</option>
              </select>
              <ChevronIcon />
            </div>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-steel-light bg-as-snow/70 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-sm text-as-secondary tabular-nums">
              <span className="font-semibold text-as-dark">
                {filtered.length}
              </span>{" "}
              {t.catalogueResults}
            </p>
            {brand !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setBrand("all");
                    syncUrl({ brand: "all" });
                  });
                }}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-steel-light bg-as-white px-2.5 py-1 text-caption text-as-dark hover:border-as-dark/30 transition-colors"
              >
                <span className="truncate">{brand}</span>
                <span aria-hidden className="text-as-gray">
                  ×
                </span>
              </button>
            ) : null}
            {category !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setCategory("all");
                    syncUrl({ category: "all" });
                  });
                }}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-steel-light bg-as-white px-2.5 py-1 text-caption text-as-dark hover:border-as-dark/30 transition-colors"
              >
                <span className="truncate">{categoryLabel}</span>
                <span aria-hidden className="text-as-gray">
                  ×
                </span>
              </button>
            ) : null}
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 text-sm font-medium text-as-dark underline underline-offset-2 decoration-as-mist hover:decoration-as-dark transition-colors"
            >
              {t.catalogueClearFilters}
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 sm:py-16 px-4 text-center text-as-secondary border border-dashed border-steel-light text-sm sm:text-base rounded-xl">
          {t.catalogueEmpty}
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[clamp(0.55rem,0.4rem+0.7vw,1rem)]">
          {filtered.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} compact />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
