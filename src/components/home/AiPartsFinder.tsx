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
  "Filtri i vajit Golf 7",
  "Feroda para Audi A4",
  "Vaj motori 5W-30",
];
const PLACEHOLDERS_EN = [
  "Oil filter Golf 7",
  "Front brake pads Audi A4",
  "Engine oil 5W-30",
];

const CHIPS_SQ = ["Filtri vajit", "Feroda", "LIQUI MOLY", "K607"];
const CHIPS_EN = ["Oil filter", "Brake pads", "LIQUI MOLY", "K607"];

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5 13.6 8.4 19.5 10 13.6 11.6 12 17.5 10.4 11.6 4.5 10 10.4 8.4 12 2.5Z" />
      <path d="M18.5 14.2 19.3 17.1 22.2 17.9 19.3 18.7 18.5 21.6 17.7 18.7 14.8 17.9 17.7 17.1 18.5 14.2Z" />
    </svg>
  );
}

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
 * Homepage AI parts finder — same UX pattern as Autodekor Buli:
 * branded bar → natural-language ask → inline catalogue cards → WhatsApp fallback.
 */
export default function AiPartsFinder() {
  const { t, locale } = useLanguage();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [result, setResult] = useState<FindPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chips = locale === "en" ? CHIPS_EN : CHIPS_SQ;
  const phs = locale === "en" ? PLACEHOLDERS_EN : PLACEHOLDERS_SQ;

  // Typing placeholder animation (idle only)
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
          logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
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
      ? `Përshëndetje AUTO SHABANI, po kërkoj: ${result?.meta.query || "…"}. A e keni?`
      : `Hello AUTO SHABANI, I’m looking for: ${result?.meta.query || "…"}. Do you have it?`
  );
  const waFitment = whatsappEnquireUrl(
    locale === "sq"
      ? "Përshëndetje AUTO SHABANI, dua të verifikoj nëse pjesa i përshtatet veturës time. Modeli / viti:"
      : "Hello AUTO SHABANI, I want to verify if the part fits my car. Model / year:"
  );

  return (
    <section className="relative z-20 -mt-5 sm:-mt-7 px-0">
      <div className="container-as min-w-0">
        <div
          className={`ai-finder relative overflow-hidden rounded-[1.25rem] text-white shadow-card ${
            open ? "ai-finder--open" : ""
          }`}
        >
          <div className="ai-finder__orb ai-finder__orb--1" aria-hidden />
          <div className="ai-finder__orb ai-finder__orb--2" aria-hidden />

          <div className="relative grid gap-4 p-3.5 sm:p-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6 md:px-5">
            <div className="flex items-center justify-between gap-3 md:justify-start">
              <div className="flex items-center gap-3 min-w-0">
                <span className="ai-finder__ico grid h-9 w-9 place-items-center rounded-[0.65rem] text-white">
                  <SparkleIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 leading-none">
                  <p className="font-display text-[1.35rem] sm:text-[1.55rem] tracking-tight uppercase">
                    <span className="font-light opacity-90">{t.aiFindBrand}</span>{" "}
                    <span className="font-extrabold text-white">{t.aiFindAi}</span>
                  </p>
                  <p className="mt-1 text-[0.65rem] sm:text-[0.7rem] uppercase tracking-[0.18em] text-white/70">
                    {t.aiFindTagline}
                  </p>
                </div>
              </div>
              {open ? (
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-control border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/20 transition-colors md:hidden"
                >
                  {t.aiFindClose}
                </button>
              ) : null}
            </div>

            <div className="min-w-0">
              {open ? (
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-white/65">{t.aiFindLive}</p>
                  <button
                    type="button"
                    onClick={close}
                    className="hidden md:inline-flex rounded-control border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/20 transition-colors"
                  >
                    {t.aiFindClose}
                  </button>
                </div>
              ) : null}

              <div
                ref={logRef}
                className={`ai-finder__log space-y-3 ${open ? "mb-3 max-h-[22rem] overflow-y-auto pr-1" : "hidden"}`}
              >
                {loading ? (
                  <div className="rounded-card bg-white/10 p-3">
                    <div className="h-3 w-40 bg-white/25 animate-pulse rounded-sm mb-3" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-24 bg-white/15 animate-pulse rounded-card" />
                      <div className="h-24 bg-white/15 animate-pulse rounded-card" />
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <p className="rounded-card bg-white/10 px-3 py-2 text-sm text-white/90">
                    {error}
                  </p>
                ) : null}

                {result && !loading ? (
                  <div className="rounded-card bg-white/10 p-3 sm:p-4">
                    {result.items.length > 0 ? (
                      <>
                        <p className="text-sm text-white/90 mb-3">
                          {result.intro || t.aiFindFound}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {result.items.map((item) => (
                            <Link
                              key={item.slug}
                              href={item.url}
                              className="group flex gap-3 rounded-card bg-white p-2.5 text-as-dark shadow-sm hover:shadow-card transition-shadow"
                            >
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-as-snow">
                                <Image
                                  src={item.image}
                                  alt=""
                                  fill
                                  sizes="64px"
                                  className="object-contain p-1"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                {item.brand ? (
                                  <p className="text-[0.65rem] uppercase tracking-wide text-as-gray truncate">
                                    {item.brand}
                                  </p>
                                ) : null}
                                <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-accent">
                                  {item.price ?? t.cataloguePriceOnRequest}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-white/65">
                          {t.aiFindFitmentNote}{" "}
                          <a
                            href={waFitment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 text-white hover:text-white"
                            onClick={() =>
                              trackEvent("whatsapp_click", { place: "ai_find_fitment" })
                            }
                          >
                            WhatsApp
                          </a>
                          .
                        </p>
                        <div className="mt-3">
                          <Link
                            href={`/katalogu?q=${encodeURIComponent(result.meta.query)}`}
                            className="text-xs font-medium text-white/85 underline underline-offset-2 hover:text-white"
                          >
                            {t.aiFindSeeAll}
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-white/90 mb-3">
                          {t.aiFindEmpty}
                        </p>
                        <a
                          href={waEmpty}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            trackEvent("whatsapp_click", { place: "ai_find_empty" })
                          }
                          className="inline-flex items-center justify-center rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-deep transition-colors"
                        >
                          {t.aiFindAskWhatsApp}
                        </a>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              <form onSubmit={onSubmit} className="relative">
                <label htmlFor={inputId} className="sr-only">
                  {t.aiFindPlaceholder}
                </label>
                <div className="flex items-center gap-2 rounded-control bg-white p-1.5 shadow-sm">
                  <span className="pl-2.5 text-as-gray" aria-hidden>
                    <SearchIcon className="h-5 w-5" />
                  </span>
                  <input
                    ref={inputRef}
                    id={inputId}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder || t.aiFindPlaceholder}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-as-dark text-body outline-none placeholder:text-as-gray"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-deep disabled:opacity-60 transition-colors"
                  >
                    <SearchIcon className="h-4 w-4" />
                    <span>{t.aiFindSubmit}</span>
                  </button>
                </div>
              </form>

              {!open ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void ask(chip)}
                      className="rounded-control border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/20 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
