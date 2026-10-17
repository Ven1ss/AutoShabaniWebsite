"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useLanguage } from "@/context/LanguageContext";
import { whatsappEnquireUrl } from "@/lib/contact";
import { trackEvent } from "@/lib/analytics";
import { pushRecentSearch } from "@/lib/recent-searches";
import type { ChatProductCard } from "@/lib/ai-chat";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ChatProductCard[];
  clarifying?: boolean;
  eventId?: string | null;
  feedback?: "helpful" | "not_helpful" | null;
};

type SearchMode = "normal" | "ai";

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

function AiSparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.2 13.2 8.4 18.4 9.6 13.2 10.8 12 16 10.8 10.8 5.6 9.6 10.8 8.4 12 3.2Z" />
      <path d="M18.2 14.2 18.8 16.6 21.2 17.2 18.8 17.8 18.2 20.2 17.6 17.8 15.2 17.2 17.6 16.6 18.2 14.2Z" />
    </svg>
  );
}

/**
 * Google-like homepage search with two explicit modes:
 * - Normal → /katalogu?q= (existing catalogue search)
 * - AI → conversational product results (must be toggled on)
 */
export default function AiPartsFinder() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const inputId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<SearchMode>("normal");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `s-${Date.now()}`;
  });

  useEffect(() => {
    if (!aiOpen) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, aiOpen]);

  function runNormalSearch(q: string) {
    const query = q.trim();
    if (query) pushRecentSearch(query);
    trackEvent("search_normal", { q: query.slice(0, 80), locale });
    router.push(query ? `/katalogu?q=${encodeURIComponent(query)}` : "/katalogu");
  }

  async function runAiSearch(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    setAiOpen(true);
    setMode("ai");

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setDraft("");
    setLoading(true);
    trackEvent("ai_chat", { q: content.slice(0, 80), locale });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          sessionId,
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!res.ok) throw new Error("chat_failed");
      const data = (await res.json()) as {
        reply: string;
        products: ChatProductCard[];
        meta?: { clarifying?: boolean; eventId?: string | null };
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          products: data.products ?? [],
          clarifying: Boolean(data.meta?.clarifying),
          eventId: data.meta?.eventId ?? null,
          feedback: null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: t.aiFindError,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "ai") {
      void runAiSearch(draft);
    } else {
      runNormalSearch(draft);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (mode === "ai") void runAiSearch(draft);
      else runNormalSearch(draft);
    }
  }

  function enableAi() {
    setMode("ai");
    setAiOpen(true);
    inputRef.current?.focus();
  }

  function enableNormal() {
    setMode("normal");
    // Keep chat history if already open, but don't auto-run AI
  }

  function resetChat() {
    setMessages([]);
    setDraft("");
    inputRef.current?.focus();
  }

  async function postFeedbackSignal(opts: {
    eventId?: string | null;
    signal: "helpful" | "not_helpful" | "clicked_product";
    productId?: string;
  }) {
    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: opts.eventId || null,
          signal: opts.signal,
          productId: opts.productId || null,
          sessionId,
        }),
      });
    } catch {
      /* non-blocking */
    }
  }

  async function sendFeedback(
    messageId: string,
    eventId: string | null | undefined,
    signal: "helpful" | "not_helpful"
  ) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: signal } : m))
    );
    await postFeedbackSignal({ eventId, signal });
  }

  function logProductClick(
    eventId: string | null | undefined,
    productId: string
  ) {
    void postFeedbackSignal({
      eventId,
      signal: "clicked_product",
      productId,
    });
  }

  const waHelp = whatsappEnquireUrl(
    locale === "sq"
      ? "Përshëndetje AUTO SHABANI, dua ndihmë për një pjesë. "
      : "Hello AUTO SHABANI, I need help finding a part. "
  );

  return (
    <section className="relative z-20 -mt-6 sm:-mt-8">
      <div className="container-as min-w-0">
        <div className="mx-auto max-w-3xl">
          {/* Google-like search shell */}
          <form
            onSubmit={onSubmit}
            className={`google-search bg-as-white shadow-card transition-shadow ${
              mode === "ai" ? "google-search--ai" : ""
            }`}
          >
            <label htmlFor={inputId} className="sr-only">
              {mode === "ai" ? t.aiSearchPlaceholder : t.searchPlaceholder}
            </label>
            <div className="flex items-center gap-2 px-3 sm:px-4">
              <SearchIcon className="h-5 w-5 shrink-0 text-as-gray" />
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  mode === "ai" ? t.aiSearchPlaceholder : t.searchPlaceholder
                }
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent py-3.5 text-as-dark text-body outline-none placeholder:text-as-gray"
              />
              <button
                type="button"
                onClick={() => (mode === "ai" ? enableNormal() : enableAi())}
                aria-pressed={mode === "ai"}
                title={t.aiSearchToggleHint}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  mode === "ai"
                    ? "bg-accent text-white"
                    : "bg-as-snow text-as-secondary hover:bg-as-mist hover:text-as-dark"
                }`}
              >
                <AiSparkIcon className="h-4 w-4" />
                <span className="sr-only">{t.aiSearchToggle}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-as-mist px-3 py-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("normal");
                  runNormalSearch(draft);
                }}
                className="rounded-sm bg-as-snow px-4 py-2 text-sm text-as-dark hover:bg-as-mist transition-colors"
              >
                {t.searchSubmit}
              </button>
              <button
                type="button"
                disabled={loading || !draft.trim()}
                onClick={() => {
                  setMode("ai");
                  void runAiSearch(draft);
                }}
                className={`inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
                  mode === "ai"
                    ? "bg-accent text-white hover:bg-accent-deep"
                    : "bg-as-snow text-as-dark hover:bg-as-mist"
                }`}
              >
                <AiSparkIcon className="h-3.5 w-3.5" />
                {loading && mode === "ai"
                  ? t.aiFindSearching
                  : t.aiSearchSubmit}
              </button>
            </div>
          </form>

          <p className="mt-2 text-center text-[0.7rem] text-as-gray">
            {mode === "ai" ? t.aiSearchModeHint : t.normalSearchModeHint}
          </p>

          {/* AI chat — only after deliberate AI search */}
          {aiOpen ? (
            <div className="google-ai-panel mt-4 overflow-hidden border border-as-mist bg-as-white shadow-card">
              <div className="flex items-center justify-between gap-3 border-b border-as-mist px-4 py-2.5">
                <p className="text-caption font-medium text-as-secondary">
                  {t.aiFindLive}
                </p>
                <div className="flex items-center gap-3">
                  {messages.length > 0 ? (
                    <button
                      type="button"
                      onClick={resetChat}
                      className="text-xs font-medium text-as-secondary underline underline-offset-2 hover:text-as-dark"
                    >
                      {t.aiFindNewChat}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setAiOpen(false);
                      setMode("normal");
                    }}
                    className="text-xs font-medium text-as-secondary underline underline-offset-2 hover:text-as-dark"
                  >
                    {t.aiFindClose}
                  </button>
                </div>
              </div>

              <div
                ref={listRef}
                className="max-h-[min(70vh,36rem)] space-y-4 overflow-y-auto px-4 py-4"
                aria-live="polite"
              >
                {messages.length === 0 && !loading ? (
                  <p className="text-sm text-as-secondary">{t.aiFindWelcome}</p>
                ) : null}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-full sm:max-w-[95%] ${
                        m.role === "user"
                          ? "rounded-2xl rounded-br-sm bg-as-dark px-3.5 py-2.5 text-white"
                          : "w-full"
                      }`}
                    >
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user" ? "text-white" : "text-as-secondary"
                        }`}
                      >
                        {m.content}
                      </p>

                      {m.role === "assistant" &&
                      m.products &&
                      m.products.length > 0 ? (
                        <ul className="mt-3 divide-y divide-as-mist border border-as-mist">
                          {m.products.map((item) => (
                            <li key={item.id}>
                              <Link
                                href={item.url}
                                onClick={() => {
                                  trackEvent("ai_product_click", {
                                    id: item.id.slice(0, 36),
                                  });
                                  logProductClick(m.eventId, item.id);
                                }}
                                className="group flex items-center gap-3 bg-as-snow/60 p-3 hover:bg-as-snow sm:gap-4"
                              >
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-as-white">
                                  <Image
                                    src={item.image}
                                    alt=""
                                    fill
                                    sizes="56px"
                                    className="object-contain p-1"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  {item.brand ? (
                                    <p className="text-[0.65rem] uppercase tracking-[0.12em] text-as-gray">
                                      {item.brand}
                                    </p>
                                  ) : null}
                                  <p className="text-sm font-medium leading-snug line-clamp-2 text-as-dark group-hover:text-accent transition-colors">
                                    {item.title}
                                  </p>
                                  <p className="mt-0.5 font-mono text-[0.7rem] text-as-gray">
                                    {[item.sku, item.category]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                </div>
                                <p className="shrink-0 text-sm font-semibold text-accent tabular-nums">
                                  {item.price ?? t.cataloguePriceOnRequest}
                                </p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {m.role === "assistant" &&
                      (!m.products || m.products.length === 0) &&
                      m.clarifying ? (
                        <a
                          href={waHelp}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            trackEvent("whatsapp_click", {
                              place: "ai_chat_empty",
                            })
                          }
                          className="mt-3 inline-flex items-center justify-center rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-deep transition-colors"
                        >
                          {t.aiFindAskWhatsApp}
                        </a>
                      ) : null}

                      {m.role === "assistant" &&
                      m.feedback !== undefined ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {m.feedback === "helpful" ||
                          m.feedback === "not_helpful" ? (
                            <p className="text-[0.7rem] text-as-gray">
                              {t.aiFeedbackThanks}
                            </p>
                          ) : (
                            <>
                              <p className="text-[0.7rem] text-as-gray">
                                {t.aiFeedbackPrompt}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  void sendFeedback(
                                    m.id,
                                    m.eventId,
                                    "helpful"
                                  )
                                }
                                className="rounded-sm border border-as-mist bg-as-snow px-2.5 py-1 text-[0.7rem] font-medium text-as-dark hover:bg-as-mist"
                              >
                                {t.aiFeedbackYes}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void sendFeedback(
                                    m.id,
                                    m.eventId,
                                    "not_helpful"
                                  )
                                }
                                className="rounded-sm border border-as-mist bg-as-snow px-2.5 py-1 text-[0.7rem] font-medium text-as-dark hover:bg-as-mist"
                              >
                                {t.aiFeedbackNo}
                              </button>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {loading ? (
                  <div className="space-y-2" aria-busy="true">
                    <div className="h-3 w-32 animate-pulse rounded-sm bg-as-mist" />
                    <div className="h-16 w-full animate-pulse bg-as-snow" />
                    <div className="h-16 w-full animate-pulse bg-as-snow" />
                  </div>
                ) : null}
              </div>

              {messages.length > 0 ? (
                <div className="border-t border-as-mist px-4 py-3">
                  <p className="mb-2 text-[0.7rem] text-as-gray">
                    {t.aiRefineHint}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="search"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void runAiSearch(draft);
                        }
                      }}
                      placeholder={t.aiRefinePlaceholder}
                      className="min-w-0 flex-1 rounded-control border border-as-mist bg-as-snow px-3 py-2.5 text-sm outline-none focus:border-as-dark/25 focus:bg-as-white"
                    />
                    <button
                      type="button"
                      disabled={loading || !draft.trim()}
                      onClick={() => void runAiSearch(draft)}
                      className="rounded-control bg-as-dark px-4 py-2.5 text-sm font-medium text-white hover:bg-as-black disabled:opacity-50"
                    >
                      {t.aiFindSubmit}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
