"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useLanguage } from "@/context/LanguageContext";
import { whatsappEnquireUrl } from "@/lib/contact";
import { trackEvent } from "@/lib/analytics";
import type { AiFindItem } from "@/lib/ai-find";

type FindPayload = {
  intro: string;
  items: AiFindItem[];
  meta: { query: string; aiUsed: boolean; resultCount: number };
};

const PLACEHOLDERS_SQ = [
  "p.sh. vaj 5W-30",
  "p.sh. LIQUI MOLY",
  "p.sh. antifriz G13",
];
const PLACEHOLDERS_EN = [
  "e.g. oil 5W-30",
  "e.g. LIQUI MOLY",
  "e.g. coolant G13",
];

const CHIPS_SQ = ["LIQUI MOLY", "Vaj 5W-30", "Antifriz", "K2"];
const CHIPS_EN = ["LIQUI MOLY", "Oil 5W-30", "Coolant", "K2"];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Smart stock lookup — unique Auto Shabani “parts counter” panel.
 * Natural-language ask → catalogue hits → WhatsApp when nothing matches.
 */
export default function AiPartsFinder() {
  const { t, locale } = useLanguage();
  const inputId = useId();
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [result, setResult] = useState<FindPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chips = locale === "en" ? CHIPS_EN : CHIPS_SQ;
  const phs = locale === "en" ? PLACEHOLDERS_EN : PLACEHOLDERS_SQ;

  useEffect(() => {
    let cancelled = false;
    let pi = 0;
    let ci = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      if (document.activeElement === inputRef.current || query) {
        setPlaceholder("");
        timer = setTimeout(tick, 400);
        return;
      }
      const s = phs[pi] ?? "";
      if (!deleting) {
        ci += 1;
        setPlaceholder(s.slice(0, ci));
        if (ci >= s.length) {
          deleting = true;
          timer = setTimeout(tick, 1400);
          return;
        }
        timer = setTimeout(tick, 70);
        return;
      }
      ci -= 1;
      setPlaceholder(s.slice(0, ci));
      if (ci <= 0) {
        deleting = false;
        pi = (pi + 1) % phs.length;
        timer = setTimeout(tick, 350);
        return;
      }
      timer = setTimeout(tick, 30);
    };

    timer = setTimeout(tick, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phs, query]);

  const ask = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) {
        inputRef.current?.focus();
        return;
      }

      setOpen(true);
      setLoading(true);
      setError(null);
      setResult(null);
      setQuery("");
      trackEvent("ai_find", { q: q.slice(0, 80), locale });

      try {
        const res = await fetch("/api/ai/find", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q, locale, limit: 8 }),
        });
        if (!res.ok) throw new Error("find_failed");
        const data = (await res.json()) as FindPayload;
        setResult(data);
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      } catch {
        setError(t.aiFindError);
      } finally {
        setLoading(false);
      }
    },
    [locale, t.aiFindError]
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(query);
  }

  function close() {
    setOpen(false);
    setResult(null);
    setError(null);
    setLoading(false);
  }

  const waEmpty = whatsappEnquireUrl(
    locale === "sq"
      ? `Përshëndetje AUTO SHABANI, po kërkoj: ${result?.meta.query || "…"}. A e keni në stok?`
      : `Hello AUTO SHABANI, I’m looking for: ${result?.meta.query || "…"}. Do you have it in stock?`
  );
  const waFitment = whatsappEnquireUrl(
    locale === "sq"
      ? "Përshëndetje AUTO SHABANI, dua të konfirmoj kodin për veturën time. Modeli / viti:"
      : "Hello AUTO SHABANI, I want to confirm the code for my vehicle. Model / year:"
  );

  return (
    <section className="relative z-20 -mt-6 sm:-mt-8">
      <div className="container-as min-w-0">
        <div className="stock-lookup overflow-hidden bg-as-white text-as-dark shadow-card">
          <div className="stock-lookup__rail" aria-hidden />

          <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-10 lg:p-7">
            <header className="min-w-0 self-center">
              <p className="text-caption font-medium uppercase tracking-[0.14em] text-accent">
                {t.aiFindEyebrow}
              </p>
              <h2 className="mt-2 text-section text-as-dark max-w-[16ch]">
                {t.aiFindTitle}
              </h2>
              <p className="mt-3 text-body text-as-secondary max-w-md">
                {t.aiFindSubtitle}
              </p>
            </header>

            <div className="min-w-0">
              <form onSubmit={onSubmit} className="stock-lookup__form">
                <label htmlFor={inputId} className="sr-only">
                  {t.aiFindPlaceholder}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-control sm:border sm:border-as-mist sm:bg-as-snow sm:p-1.5 sm:focus-within:border-as-dark/25 sm:focus-within:bg-as-white transition-colors">
                  <input
                    ref={inputRef}
                    id={inputId}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder || t.aiFindPlaceholder}
                    autoComplete="off"
                    aria-controls={open ? panelId : undefined}
                    aria-expanded={open}
                    className="min-w-0 flex-1 rounded-control border border-as-mist bg-as-snow px-4 py-3 text-as-dark text-body outline-none placeholder:text-as-gray focus:border-as-dark/30 focus:bg-as-white sm:border-0 sm:bg-transparent sm:px-3 sm:py-2.5 sm:focus:bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-control bg-as-dark px-5 py-3 text-sm font-medium text-white hover:bg-as-black disabled:opacity-60 transition-colors sm:min-w-[8.5rem]"
                  >
                    <SearchIcon className="h-4 w-4" />
                    <span>{loading ? t.aiFindSearching : t.aiFindSubmit}</span>
                  </button>
                </div>
              </form>

              {!open ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="sr-only">{t.aiFindTry}</span>
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void ask(chip)}
                      className="rounded-sm border border-as-mist bg-as-snow px-3 py-1.5 text-xs font-medium text-as-secondary hover:border-as-dark/20 hover:text-as-dark transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              ) : null}

              <div
                id={panelId}
                ref={resultsRef}
                hidden={!open}
                className="stock-lookup__panel mt-5 border-t border-as-mist pt-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-caption font-medium text-as-secondary">
                    {t.aiFindLive}
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="text-xs font-medium text-as-secondary underline underline-offset-2 hover:text-as-dark transition-colors"
                  >
                    {t.aiFindClose}
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-2" aria-busy="true">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[4.5rem] animate-pulse bg-as-snow"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                ) : null}

                {error ? (
                  <p className="text-sm text-as-secondary">{error}</p>
                ) : null}

                {result && !loading ? (
                  result.items.length > 0 ? (
                    <div className="stock-lookup__hits">
                      <p className="mb-3 text-sm text-as-dark">
                        {result.intro || t.aiFindFound}
                      </p>
                      <ul className="divide-y divide-as-mist border-y border-as-mist">
                        {result.items.map((item, index) => (
                          <li
                            key={item.slug}
                            className="stock-lookup__hit"
                            style={{ animationDelay: `${index * 45}ms` }}
                          >
                            <Link
                              href={item.url}
                              className="group flex items-center gap-3 py-3 sm:gap-4"
                            >
                              <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-as-snow sm:h-16 sm:w-16">
                                <Image
                                  src={item.image}
                                  alt=""
                                  fill
                                  sizes="64px"
                                  className="object-contain p-1.5"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                {item.brand ? (
                                  <p className="text-[0.65rem] uppercase tracking-[0.12em] text-as-gray">
                                    {item.brand}
                                  </p>
                                ) : null}
                                <p className="text-sm font-medium leading-snug text-as-dark line-clamp-2 group-hover:text-accent transition-colors">
                                  {item.title}
                                </p>
                                {item.sku ? (
                                  <p className="mt-0.5 font-mono text-[0.7rem] text-as-gray">
                                    {item.sku}
                                  </p>
                                ) : null}
                              </div>
                              <p className="shrink-0 text-sm font-semibold text-accent tabular-nums">
                                {item.price ?? t.cataloguePriceOnRequest}
                              </p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-as-secondary">
                        {t.aiFindFitmentNote}{" "}
                        <a
                          href={waFitment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-as-dark underline underline-offset-2 hover:text-accent"
                          onClick={() =>
                            trackEvent("whatsapp_click", {
                              place: "ai_find_fitment",
                            })
                          }
                        >
                          WhatsApp
                        </a>
                        .
                      </p>
                      <Link
                        href={`/katalogu?q=${encodeURIComponent(result.meta.query)}`}
                        className="mt-3 inline-flex text-xs font-medium text-as-dark underline underline-offset-2 hover:text-accent"
                      >
                        {t.aiFindSeeAll}
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-as-snow px-4 py-5 sm:px-5">
                      <p className="text-sm text-as-dark">{t.aiFindEmpty}</p>
                      <p className="mt-1 text-xs text-as-secondary">
                        {t.aiFindEmptyHint}
                      </p>
                      <a
                        href={waEmpty}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent("whatsapp_click", {
                            place: "ai_find_empty",
                          })
                        }
                        className="mt-4 inline-flex items-center justify-center rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-deep transition-colors"
                      >
                        {t.aiFindAskWhatsApp}
                      </a>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
