"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useLanguage } from "@/context/LanguageContext";

export type SearchSuggestion = {
  type: "product" | "brand" | "query";
  label: string;
  subtitle?: string;
  slug?: string;
  query?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  /**
   * When this key changes, reset the field to `value` (e.g. URL `q` after
   * submit / back navigation). Do NOT pass the live draft string here —
   * that would re-sync on every keystroke and can fight the caret.
   */
  syncKey?: string;
  autoFocus?: boolean;
  size?: "hero" | "bar";
  /** Debounced autocomplete suggestions (parent fetches). */
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (item: SearchSuggestion) => void;
  suggestionsLoading?: boolean;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
 * Single-row search control with optional autocomplete.
 * Draft text is owned locally so catalogue re-renders cannot reset the caret.
 */
export default function CatalogueSearchTicket({
  value,
  onChange,
  onSubmit,
  syncKey,
  autoFocus,
  size = "hero",
  suggestions = [],
  onSuggestionSelect,
  suggestionsLoading = false,
}: Props) {
  const { t } = useLanguage();
  const id = useId();
  const listId = `${id}-list`;
  const large = size === "hero";
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (syncKey === undefined) return;
    setText(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- value read at syncKey change
  }, [syncKey]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showList =
    open && text.trim().length >= 2 && (suggestions.length > 0 || suggestionsLoading);

  function commit(next: string) {
    const q = next.trim();
    setText(next);
    onChange(next);
    onSubmit?.(q);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      const item = suggestions[activeIndex];
      onSuggestionSelect?.(item);
      commit(item.query || item.label);
      return;
    }
    commit(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!showList || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  }

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <form onSubmit={handleSubmit} className="w-full min-w-0">
        <div className="flex min-w-0 items-stretch overflow-hidden rounded-xl border border-steel-light bg-as-white">
          <label htmlFor={id} className="sr-only">
            {t.searchLabel}
          </label>
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
            }
            enterKeyHint="search"
            value={text}
            autoFocus={autoFocus}
            onChange={(e) => {
              const next = e.target.value;
              setText(next);
              onChange(next);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t.searchPlaceholder}
            title={t.searchHint}
            className={`min-w-0 flex-1 bg-transparent text-as-dark placeholder:text-as-gray outline-none text-base ${
              large
                ? "px-3.5 py-3 sm:px-5 sm:py-3.5"
                : "px-3 py-2.5 sm:px-3.5 sm:py-3"
            }`}
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          {text ? (
            <button
              type="button"
              aria-label={t.searchClear}
              onClick={() => {
                setText("");
                onChange("");
                setOpen(false);
                setActiveIndex(-1);
              }}
              className="shrink-0 px-2 text-as-gray hover:text-as-dark"
            >
              ×
            </button>
          ) : null}
          <button
            type="submit"
            aria-label={t.searchSubmit}
            className={`inline-flex shrink-0 items-center justify-center gap-2 bg-accent text-white font-medium transition-colors hover:bg-accent-deep active:bg-accent-deep ${
              large
                ? "min-h-12 min-w-12 px-3.5 sm:min-w-0 sm:px-6 text-sm"
                : "min-h-11 min-w-11 px-3 sm:min-w-0 sm:px-5 text-sm"
            }`}
          >
            <SearchIcon className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">{t.searchSubmit}</span>
          </button>
        </div>
        <p className="mt-1.5 px-0.5 text-[11px] leading-snug text-as-gray sm:mt-2 sm:text-caption">
          {t.searchHint}
        </p>
      </form>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-steel-light bg-as-white py-1 shadow-card"
        >
          {suggestionsLoading && suggestions.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-as-gray">{t.searchSuggestLoading}</li>
          ) : null}
          {suggestions.map((item, index) => (
            <li key={`${item.type}-${item.label}-${index}`} role="presentation">
              <button
                type="button"
                id={`${listId}-opt-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm ${
                  index === activeIndex
                    ? "bg-as-snow text-as-dark"
                    : "text-as-dark hover:bg-as-snow"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onSuggestionSelect?.(item);
                  commit(item.query || item.label);
                }}
              >
                <span className="font-medium">{item.label}</span>
                {item.subtitle ? (
                  <span className="text-caption text-as-gray">{item.subtitle}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
