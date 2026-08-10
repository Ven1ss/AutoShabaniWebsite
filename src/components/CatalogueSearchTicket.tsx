"use client";

import { FormEvent, useId } from "react";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  autoFocus?: boolean;
  size?: "hero" | "bar";
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
 * Single-row search control. Never stacks label/input/button vertically —
 * that layout collapses into a cramped mess under ~640px.
 */
export default function CatalogueSearchTicket({
  value,
  onChange,
  onSubmit,
  autoFocus,
  size = "hero",
}: Props) {
  const { t } = useLanguage();
  const id = useId();
  const large = size === "hero";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit?.(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0">
      <div className="flex min-w-0 items-stretch overflow-hidden rounded-xl border border-steel-light bg-as-white">
        <label htmlFor={id} className="sr-only">
          {t.searchLabel}
        </label>
        <input
          id={id}
          type="search"
          enterKeyHint="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          title={t.searchHint}
          className={`min-w-0 flex-1 bg-transparent text-as-dark placeholder:text-as-gray outline-none text-base [&::-webkit-search-cancel-button]:appearance-none ${
            large ? "px-3.5 py-3 sm:px-5 sm:py-3.5" : "px-3 py-2.5 sm:px-3.5 sm:py-3"
          }`}
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
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
  );
}
