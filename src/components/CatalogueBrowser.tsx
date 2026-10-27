"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import BackToTopButton from "@/components/BackToTopButton";
import CatalogueSearchTicket, {
  type SearchSuggestion,
} from "@/components/CatalogueSearchTicket";
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
import { rankProductsForQuery } from "@/lib/search-engine";

const PAGE_SIZE = 50;

type Props = {
  products: Product[];
};

function fillTemplate(
  template: string,
  values: Record<string, string | number>
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? "")
  );
}

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
  return rankProductsForQuery(products, q, locale).map((row) => row.product);
}

export default function CatalogueBrowser({ products }: Props) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQ = searchParams.get("q") ?? "";
  const urlBrand = searchParams.get("brand") ?? "all";
  const urlCategory = searchParams.get("category") ?? "all";
  const urlPageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const urlPage = Number.isFinite(urlPageRaw) && urlPageRaw > 0 ? urlPageRaw : 1;

  const [query, setQuery] = useState(urlQ);
  // Keep the input value synchronous; defer heavy filtering so typing
  // (especially mid-string edits) does not reset the caret.
  const deferredQuery = useDeferredValue(query);
  const [brand, setBrand] = useState(urlBrand);
  const [category, setCategory] = useState(urlCategory);
  const [sort, setSort] = useState<ProductSort>("relevance");
  const [page, setPage] = useState(urlPage);
  const [remoteMatches, setRemoteMatches] = useState<Product[] | null>(null);
  const [matchHints, setMatchHints] = useState<Record<string, string[]>>({});
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  // Bumped on submit / URL sync so the search field can adopt an external
  // query without re-binding on every keystroke.
  const [searchSyncNonce, setSearchSyncNonce] = useState(0);
  const searchSyncKey = `${urlQ}#${searchSyncNonce}`;
  const resultsTopRef = useRef<HTMLDivElement>(null);

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
    setPage(urlPage);
  }, [urlPage]);

  useEffect(() => {
    const q = deferredQuery.trim();
    if (!q) {
      setRemoteMatches(null);
      setMatchHints({});
      return;
    }

    // Drop stale remote hits so local fuzzy (for the current query) shows
    // until the new request finishes.
    setRemoteMatches(null);
    setMatchHints({});

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(q)}&locale=${locale}&rich=1`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = (await res.json()) as {
          products?: Product[];
          hits?: { id: string; reasons: string[] }[];
        };
        const list = data.products ?? [];
        setRemoteMatches(list);
        const hints: Record<string, string[]> = {};
        for (const hit of data.hits ?? []) {
          hints[hit.id] = hit.reasons ?? [];
        }
        setMatchHints(hints);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[catalogue] Remote search failed:", error);
        const local = rankProductsForQuery(products, q, locale);
        setRemoteMatches(local.map((row) => row.product));
        const hints: Record<string, string[]> = {};
        for (const row of local) hints[row.product.id] = row.reasons;
        setMatchHints(hints);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery, products, locale]);

  useEffect(() => {
    const q = deferredQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    setSuggestionsLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/suggest?q=${encodeURIComponent(q)}&locale=${locale}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Suggest failed: ${res.status}`);
        const data = (await res.json()) as { suggestions?: SearchSuggestion[] };
        setSuggestions(data.suggestions ?? []);
      } catch {
        if (controller.signal.aborted) return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery, locale]);

  function syncUrl(next: {
    q?: string;
    brand?: string;
    category?: string;
    page?: number;
  }) {
    const params = new URLSearchParams();
    const q = (next.q ?? query).trim();
    const b = next.brand ?? brand;
    const c = next.category ?? category;
    const p = next.page ?? page;
    if (q) params.set("q", q);
    if (b && b !== "all") params.set("brand", b);
    if (c && c !== "all") params.set("category", c);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    router.replace(qs ? `/katalogu?${qs}` : "/katalogu", { scroll: false });
  }

  function submitSearch(v: string) {
    const q = v.trim();
    setQuery(q);
    setPage(1);
    setSearchSyncNonce((n) => n + 1);
    startTransition(() => {
      syncUrl({ q, page: 1 });
      if (q) setRecent(pushRecentSearch(q));
    });
  }

  function clearFilters() {
    startTransition(() => {
      setBrand("all");
      setCategory("all");
      setSort("relevance");
      setPage(1);
      syncUrl({ brand: "all", category: "all", page: 1 });
    });
  }

  function goToPage(nextPage: number) {
    const clamped = Math.max(1, nextPage);
    setPage(clamped);
    startTransition(() => {
      syncUrl({ page: clamped });
    });
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, filtered.length);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  const hasActiveFilters =
    brand !== "all" || category !== "all" || sort !== "relevance";

  const selectClass =
    "peer w-full min-h-11 appearance-none rounded-control border border-as-mist bg-as-white pl-3 pr-10 text-sm text-as-dark outline-none transition-[border-color,box-shadow] duration-motion-fast hover:border-as-gray/40 focus:border-as-dark/25 focus:shadow-[0_0_0_3px_rgba(29,29,31,0.06)]";

  function categoryDisplayName(value: string): string {
    if (isProductCategory(value)) return t[`cat_${value}`];
    // Soften raw DB strings: "Aksesore per veture" → title-ish
    return value
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const categoryLabel =
    category === "all" ? t.catalogueAll : categoryDisplayName(category);

  const chipBase =
    "inline-flex min-h-10 items-center gap-1.5 rounded-control border px-3.5 py-2 text-sm transition-colors";
  const chipIdle =
    "border-as-mist bg-as-white text-as-dark hover:border-as-dark/20 hover:bg-as-snow";
  const chipActive = "border-as-dark bg-as-dark text-white";

  return (
    <div>
      <div className="mb-5 min-w-0 sm:mb-6">
        <CatalogueSearchTicket
          value={query}
          syncKey={searchSyncKey}
          onChange={setQuery}
          onSubmit={submitSearch}
          size="bar"
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          onSuggestionSelect={(item) => {
            if (item.type === "product" && item.slug) {
              router.push(`/katalogu/${item.slug}`);
              return;
            }
            submitSearch(item.query || item.label);
          }}
        />
      </div>

      {recent.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-caption text-as-gray">{t.recentSearches}</span>
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => submitSearch(term)}
              className="rounded-control border border-as-mist bg-as-white px-2.5 py-1.5 text-caption text-as-dark hover:border-as-dark/20"
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
            className="text-caption text-as-gray underline underline-offset-2"
          >
            {t.catalogueClearFilters}
          </button>
        </div>
      ) : null}

      {categoryFacets.length > 0 ? (
        <section className="mb-6 sm:mb-7" aria-labelledby="catalogue-categories">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2
                id="catalogue-categories"
                className="text-sm font-semibold tracking-tight text-as-dark"
              >
                {t.catalogueCategory}
              </h2>
              <p className="mt-0.5 text-caption text-as-gray">
                {t.catalogueCategoriesHint}
              </p>
            </div>
            {category !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setCategory("all");
                    setPage(1);
                    syncUrl({ category: "all", page: 1 });
                  });
                }}
                className="shrink-0 text-caption font-medium text-as-dark underline underline-offset-2"
              >
                {t.facetAll}
              </button>
            ) : null}
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <li>
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setCategory("all");
                    setPage(1);
                    syncUrl({ category: "all", page: 1 });
                  });
                }}
                className={`w-full justify-between ${chipBase} ${
                  category === "all" ? chipActive : chipIdle
                }`}
              >
                <span className="truncate text-left">{t.facetAll}</span>
                <span
                  className={`tabular-nums text-caption ${
                    category === "all" ? "text-white/70" : "text-as-gray"
                  }`}
                >
                  {products.length}
                </span>
              </button>
            </li>
            {categoryFacets.map((facet) => {
              const label = categoryDisplayName(facet.value);
              const active = category === facet.value;
              return (
                <li key={facet.value}>
                  <button
                    type="button"
                    title={label}
                    onClick={() => {
                      startTransition(() => {
                        const next = active ? "all" : facet.value;
                        setCategory(next);
                        setPage(1);
                        syncUrl({ category: next, page: 1 });
                      });
                    }}
                    className={`w-full justify-between ${chipBase} ${
                      active ? chipActive : chipIdle
                    }`}
                  >
                    <span className="truncate text-left">{label}</span>
                    <span
                      className={`shrink-0 tabular-nums text-caption ${
                        active ? "text-white/70" : "text-as-gray"
                      }`}
                    >
                      {facet.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div
        ref={resultsTopRef}
        className="mb-5 sm:mb-6 overflow-hidden rounded-xl border border-as-mist bg-as-white"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 sm:gap-4">
          <label className="relative flex flex-col gap-1.5 min-w-0">
            <span className="text-caption font-medium text-as-gray">
              {t.catalogueBrand}
            </span>
            <div className="relative">
              <select
                value={brand}
                onChange={(e) => {
                  const value = e.target.value;
                  startTransition(() => {
                    setBrand(value);
                    setPage(1);
                    syncUrl({ brand: value, page: 1 });
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

          <label className="relative flex flex-col gap-1.5 min-w-0">
            <span className="text-caption font-medium text-as-gray">
              {t.catalogueSort}
            </span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) =>
                  startTransition(() => {
                    setSort(e.target.value as ProductSort);
                    setPage(1);
                    syncUrl({ page: 1 });
                  })
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-as-mist bg-as-snow/80 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-sm text-as-secondary tabular-nums">
              <span className="font-semibold text-as-dark">
                {filtered.length}
              </span>{" "}
              {t.catalogueResults}
              {filtered.length > 0 ? (
                <span className="text-as-gray">
                  {" "}
                  ·{" "}
                  {fillTemplate(t.catalogueShowing, {
                    from: showingFrom,
                    to: showingTo,
                    total: filtered.length,
                  })}
                </span>
              ) : null}
            </p>
            {brand !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setBrand("all");
                    setPage(1);
                    syncUrl({ brand: "all", page: 1 });
                  });
                }}
                className="inline-flex max-w-full items-center gap-1.5 rounded-control border border-as-mist bg-as-white px-2.5 py-1.5 text-caption text-as-dark"
              >
                <span className="text-as-gray">{t.catalogueBrand}:</span>
                <span className="truncate font-medium">{brand}</span>
                <span aria-hidden>×</span>
              </button>
            ) : null}
            {category !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setCategory("all");
                    setPage(1);
                    syncUrl({ category: "all", page: 1 });
                  });
                }}
                className="inline-flex max-w-full items-center gap-1.5 rounded-control border border-as-mist bg-as-white px-2.5 py-1.5 text-caption text-as-dark"
              >
                <span className="text-as-gray">{t.catalogueCategory}:</span>
                <span className="truncate font-medium">{categoryLabel}</span>
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
        <div className="py-12 sm:py-16 px-4 text-center border border-dashed border-steel-light rounded-xl space-y-3">
          <p className="text-as-secondary text-sm sm:text-base">
            {deferredQuery.trim() ? t.searchNoExact : t.catalogueEmpty}
          </p>
          {deferredQuery.trim() ? (
            <p className="text-caption text-as-gray">{t.searchFitmentNote}</p>
          ) : null}
          <Link
            href="/#contact"
            className="inline-flex min-h-11 items-center text-sm font-medium text-as-dark underline underline-offset-2"
          >
            {t.searchContactHelp}
          </Link>
        </div>
      ) : (
        <>
          {deferredQuery.trim() && Object.keys(matchHints).length > 0 ? (
            <p className="mb-3 text-caption text-as-gray">{t.searchFitmentNote}</p>
          ) : null}
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-[clamp(0.55rem,0.4rem+0.7vw,1rem)]">
            {pageItems.map((product) => (
              <li key={product.slug}>
                <ProductCard product={product} compact />
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <nav
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
              aria-label={fillTemplate(t.cataloguePageOf, {
                current: currentPage,
                total: totalPages,
              })}
            >
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex min-h-11 items-center rounded-md border border-steel-light bg-as-white px-4 text-sm font-medium text-as-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.cataloguePrevPage}
              </button>
              <p className="text-sm tabular-nums text-as-secondary">
                {fillTemplate(t.cataloguePageOf, {
                  current: currentPage,
                  total: totalPages,
                })}
              </p>
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex min-h-11 items-center rounded-md border border-steel-light bg-as-white px-4 text-sm font-medium text-as-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.catalogueNextPage}
              </button>
            </nav>
          ) : null}
        </>
      )}

      <BackToTopButton />
    </div>
  );
}
