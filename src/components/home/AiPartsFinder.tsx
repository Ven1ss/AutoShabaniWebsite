"use client";

import Image from "next/image";
import Link from "next/link";
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
import type { ChatProductCard } from "@/lib/ai-chat";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ChatProductCard[];
  clarifying?: boolean;
};

const STARTERS_SQ = [
  "Kam nevojë për vaj 5W-30",
  "A keni LIQUI MOLY?",
  "Po kërkoj antifriz G13",
];
const STARTERS_EN = [
  "I need 5W-30 oil",
  "Do you have LIQUI MOLY?",
  "Looking for G13 coolant",
];

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * In-site spare-parts chat assistant — ChatGPT-like conversation,
 * grounded exclusively in Auto Shabani Supabase catalogue.
 */
export default function AiPartsFinder() {
  const { t, locale } = useLanguage();
  const inputId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);

  const starters = locale === "en" ? STARTERS_EN : STARTERS_SQ;

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

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
        meta?: { clarifying?: boolean };
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          products: data.products ?? [],
          clarifying: Boolean(data.meta?.clarifying),
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
    void send(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  }

  function resetChat() {
    setMessages([]);
    setDraft("");
    inputRef.current?.focus();
  }

  const waHelp = whatsappEnquireUrl(
    locale === "sq"
      ? "Përshëndetje AUTO SHABANI, dua ndihmë për një pjesë. "
      : "Hello AUTO SHABANI, I need help finding a part. "
  );

  return (
    <section className="relative z-20 -mt-6 sm:-mt-8">
      <div className="container-as min-w-0">
        <div className="stock-lookup overflow-hidden bg-as-white text-as-dark shadow-card">
          <div className="stock-lookup__rail" aria-hidden />

          <div className="relative grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
            <header className="border-b border-as-mist p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-7">
              <p className="text-caption font-medium uppercase tracking-[0.14em] text-accent">
                {t.aiFindEyebrow}
              </p>
              <h2 className="mt-2 text-section text-as-dark max-w-[18ch]">
                {t.aiFindTitle}
              </h2>
              <p className="mt-3 text-body text-as-secondary max-w-md">
                {t.aiFindSubtitle}
              </p>
              <ul className="mt-5 space-y-2 text-xs text-as-secondary">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {t.aiFindBullet1}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {t.aiFindBullet2}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {t.aiFindBullet3}
                </li>
              </ul>
            </header>

            <div className="flex min-h-[22rem] flex-col sm:min-h-[26rem]">
              <div className="flex items-center justify-between gap-3 border-b border-as-mist px-4 py-3 sm:px-5">
                <p className="text-caption font-medium text-as-secondary">
                  {t.aiFindLive}
                </p>
                {messages.length > 0 ? (
                  <button
                    type="button"
                    onClick={resetChat}
                    className="text-xs font-medium text-as-secondary underline underline-offset-2 hover:text-as-dark"
                  >
                    {t.aiFindNewChat}
                  </button>
                ) : null}
              </div>

              <div
                ref={listRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
                aria-live="polite"
              >
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-as-secondary">
                      {t.aiFindWelcome}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {starters.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void send(s)}
                          className="rounded-sm border border-as-mist bg-as-snow px-3 py-2 text-left text-xs font-medium text-as-dark hover:border-as-dark/20 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[95%] sm:max-w-[90%] ${
                        m.role === "user"
                          ? "bg-as-dark text-white px-3.5 py-2.5 rounded-2xl rounded-br-sm"
                          : "w-full"
                      }`}
                    >
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user" ? "text-white" : "text-as-dark"
                        }`}
                      >
                        {m.content}
                      </p>

                      {m.role === "assistant" && m.products && m.products.length > 0 ? (
                        <ul className="mt-3 divide-y divide-as-mist border border-as-mist bg-as-snow">
                          {m.products.map((item) => (
                            <li key={item.id}>
                              <Link
                                href={item.url}
                                className="group flex items-center gap-3 p-3 sm:gap-4"
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
                                  <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                                    {item.title}
                                  </p>
                                  <p className="mt-0.5 font-mono text-[0.7rem] text-as-gray">
                                    {[item.sku, item.code].filter(Boolean).join(" · ")}
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
                    </div>
                  </div>
                ))}

                {loading ? (
                  <div className="space-y-2" aria-busy="true">
                    <div className="h-3 w-40 animate-pulse bg-as-mist rounded-sm" />
                    <div className="h-3 w-64 animate-pulse bg-as-mist rounded-sm" />
                    <div className="h-16 w-full animate-pulse bg-as-snow" />
                  </div>
                ) : null}
              </div>

              <form
                onSubmit={onSubmit}
                className="border-t border-as-mist bg-as-white p-3 sm:p-4"
              >
                <label htmlFor={inputId} className="sr-only">
                  {t.aiFindPlaceholder}
                </label>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    id={inputId}
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={t.aiFindPlaceholder}
                    disabled={loading}
                    className="min-h-[2.75rem] max-h-28 flex-1 resize-y rounded-control border border-as-mist bg-as-snow px-3.5 py-2.5 text-sm text-as-dark outline-none placeholder:text-as-gray focus:border-as-dark/25 focus:bg-as-white disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={loading || !draft.trim()}
                    className="inline-flex h-[2.75rem] items-center justify-center gap-2 rounded-control bg-as-dark px-4 text-sm font-medium text-white hover:bg-as-black disabled:opacity-50 transition-colors"
                  >
                    <SendIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {loading ? t.aiFindSearching : t.aiFindSubmit}
                    </span>
                  </button>
                </div>
                <p className="mt-2 text-[0.7rem] text-as-gray">
                  {t.aiFindDisclaimer}
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
