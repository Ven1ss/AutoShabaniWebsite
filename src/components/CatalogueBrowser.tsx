"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import CatalogueSearchTicket from "@/components/CatalogueSearchTicket";
import ProductCard from "@/components/ProductCard";
import {
  filterProducts,
  isProductCategory,
  sortProducts,
  type Product,
  type ProductSort,
} from "@/lib/products";
import {
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
} from "@/lib/recent-searches";
import { fieldMatchesQuery } from "@/lib/search-rank";

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

function countBy(
  list: Product[],
  key: "brand" | "category"
): { value: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of list) {
    const v = p[key];
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function localFuzzySearch(products: Product[], query: string, locale: "sq" | "en") {
  const q = query.trim();
  if (!q) return products;
  const scored = products
    .map((p) => {
      const fields = [p.sku, p.code, p.brand, p.name[locale], p.name.en, p.name.sq];
      let score = 0;
      for (const field of fields) {
        const m = fieldMatchesQuery(field, q);
        if (m === "exact") score += 40;
        else if (m === "includes") score += 20;
        else if (m === "fuzzy") score += 8;
      }
      if (p.featured) score += 2;
      return { p, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((row) => row.p);
}

export default function CatalogueBrowser({ products }: Props) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQ = searchParams.get("q") ?? "";
  const urlBrand = searchParams.get("brand") ?? "all";
  const urlCategory = searchParams.get("category") ?? "all";

  const [query, setQuery] = useState(urlQ);
  // Keep the input value synchronous; defer heavy filtering so typing
  // (especially mid-string edits) does not reset the caret.
  const deferredQuery = useDeferredValue(query);
  const [brand, setBrand] = useState(urlBrand);
  const [category, setCategory] = useState(urlCategory);
  const [sort, setSort] = useState<ProductSort>("relevance");
  const [remoteMatches, setRemoteMatches] = useState<Product[] | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  // Bumped on submit / URL sync so the search field can adopt an external
  // query without re-binding on every keystroke.
  const [searchSyncNonce, setSearchSyncNonce] = useState(0);
  const searchSyncKey = `${urlQ}#${searchSyncNonce}`;

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  // Sync each URL param independently so changing brand/category does not
  // wipe an in-progress (unsubmitted) search draft or reset the caret.
  useEffect(() => {
    setQuery(urlQ);
    setSearchSyncNonce((n) => n + 1);
  }, [urlQ]);

  useEffect(() => {
    setBrand(urlBrand);
  }, [urlBrand]);

  useEffect(() => {
    setCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    const q = deferredQuery.trim();
    if (!q) {
      setRemoteMatches(null);
      return;
    }

    // Drop stale remote hits so local fuzzy (for the current query) shows
    // until the new request finishes.
    setRemoteMatches(null);

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
        setRemoteMatches(localFuzzySearch(products, q, locale));
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery, products, locale]);

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

  function submitSearch(v: string) {
    const q = v.trim();
    setQuery(q);
    setSearchSyncNonce((n) => n + 1);
    startTransition(() => {
      syncUrl({ q });
      if (q) setRecent(pushRecentSearch(q));
    });
  }

  function clearFilters() {
    startTransition(() => {
      setBrand("all");
      setCategory("all");
      setSort("relevance");
      syncUrl({ brand: "all", category: "all" });
    });
  }

  const searchBase = useMemo(() => {
    if (remoteMatches) return remoteMatches;
    if (deferredQuery.trim()) {
      return localFuzzySearch(products, deferredQuery, locale);
    }
    return products;
  }, [products, remoteMatches, deferredQuery, locale]);

  const brandFacets = useMemo(
    () => countBy(filterProducts(searchBase, { category, locale }), "brand"),
    [searchBase, category, locale]
  );
  const categoryFacets = useMemo(
    () => countBy(filterProducts(searchBase, { brand, locale }), "category"),
    [searchBase, brand, locale]
  );

  const filtered = useMemo(() => {
    const base = filterProducts(searchBase, { brand, category, locale });
    return sortProducts(base, sort, locale);
  }, [searchBase, brand, category, locale, sort]);

  const hasActiveFilters =
    brand !== "all" || category !== "all" || sort !== "relevance";

  const categoryLabel =
    category === "all"
      ? t.catalogueAll
      : isProductCategory(category)
        ? t[`cat_${category}`]
        : category;

  const selectClass =
    "peer w-full min-h-12 sm:min-h-11 appearance-none rounded-md border border-steel-light bg-as-white pl-3 pr-10 text-base text-as-dark outline-none transition-[border-color,box-shadow] duration-motion-fast ease-apple hover:border-as-gray/50 focus:border-as-dark/30 focus:shadow-[0_0_0_3px_rgba(29,29,31,0.06)]";
  const labelClass = "text-sm text-as-secondary";

  return (
    <div>
      <div className="mb-3 min-w-0 sm:mb-4">
        <CatalogueSearchTicket
          value={query}
          syncKey={searchSyncKey}
          onChange={setQuery}
          onSubmit={submitSearch}
          size="bar"
        />
      </div>

      {recent.length > 0 ? (
        <div className="mb-4 -mx-1 overflow-x-auto">
          <div className="flex min-w-min items-center gap-2 px-1 pb-1">
            <span className="shrink-0 text-caption text-as-gray">
              {t.recentSearches}
            </span>
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => submitSearch(term)}
                className="shrink-0 rounded-md border border-steel-light bg-as-white px-2.5 py-1.5 text-caption text-as-dark"
              >
                {term}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                clearRecentSearches();
                setRecent([]);
              }}
              className="shrink-0 text-caption text-as-gray underline"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      {brandFacets.length > 0 ? (
        <div className="mb-3 -mx-1 overflow-x-auto">
          <div className="flex min-w-min gap-2 px-1 pb-1">
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  setBrand("all");
                  syncUrl({ brand: "all" });
                });
              }}
              className={`shrink-0 rounded-md px-3 py-2 text-caption ${
                brand === "all"
                  ? "bg-as-dark text-white"
                  : "border border-steel-light bg-as-white text-as-dark"
              }`}
            >
              {t.facetAll}
            </button>
            {brandFacets.slice(0, 12).map((facet) => (
              <button
                key={facet.value}
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setBrand(facet.value);
                    syncUrl({ brand: facet.value });
                  });
                }}
                className={`shrink-0 rounded-md px-3 py-2 text-caption tabular-nums ${
                  brand === facet.value
                    ? "bg-as-dark text-white"
                    : "border border-steel-light bg-as-white text-as-dark"
                }`}
              >
                {facet.value} ({facet.count})
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {categoryFacets.length > 0 ? (
        <div className="mb-5 -mx-1 overflow-x-auto">
          <div className="flex min-w-min gap-2 px-1 pb-1">
            {categoryFacets.slice(0, 12).map((facet) => {
              const label = isProductCategory(facet.value)
                ? t[`cat_${facet.value}`]
                : facet.value;
              return (
                <button
                  key={facet.value}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setCategory(
                        category === facet.value ? "all" : facet.value
                      );
                      syncUrl({
                        category:
                          category === facet.value ? "all" : facet.value,
                      });
                    });
                  }}
                  className={`shrink-0 rounded-md px-3 py-2 text-caption tabular-nums ${
                    category === facet.value
                      ? "bg-as-dark text-white"
                      : "border border-steel-light bg-as-white text-as-dark"
                  }`}
                >
                  {label} ({facet.count})
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mb-5 sm:mb-6 overflow-hidden rounded-xl border border-steel-light bg-as-white">
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
                {brandFacets.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.value} ({b.count})
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
                {categoryFacets.map((c) => (
                  <option key={c.value} value={c.value}>
                    {isProductCategory(c.value)
                      ? t[`cat_${c.value}`]
                      : c.value}{" "}
                    ({c.count})
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
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-steel-light bg-as-white px-2.5 py-1.5 text-caption text-as-dark"
              >
                <span className="truncate">{brand}</span>
                <span aria-hidden>×</span>
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
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-steel-light bg-as-white px-2.5 py-1.5 text-caption text-as-dark"
              >
                <span className="truncate">{categoryLabel}</span>
                <span aria-hidden>×</span>
              </button>
            ) : null}
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 min-h-10 text-sm font-medium text-as-dark underline underline-offset-2"
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
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-[clamp(0.55rem,0.4rem+0.7vw,1rem)]">
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
