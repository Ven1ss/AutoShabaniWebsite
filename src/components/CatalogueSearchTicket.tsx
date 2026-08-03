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
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`ticket overflow-hidden ${
          large ? "pl-4 md:pl-5" : "pl-3"
        }`}
      >
        <div
          className={`flex flex-col sm:flex-row sm:items-stretch ${
            large ? "gap-0" : "gap-0"
          }`}
        >
          <label
            htmlFor={id}
            className={`flex shrink-0 items-center gap-2 border-b sm:border-b-0 sm:border-r border-steel-light/80 bg-surface-alt/80 ${
              large ? "px-4 py-3 md:px-5 md:py-4" : "px-3 py-2.5"
            }`}
          >
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-signal font-semibold">
              {t.searchLabel}
            </span>
          </label>
          <div className="flex flex-1 min-w-0">
            <input
              id={id}
              type="search"
              value={value}
              autoFocus={autoFocus}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full min-w-0 bg-transparent text-ink placeholder:text-ink-faint outline-none ${
                large
                  ? "px-4 py-4 md:px-5 md:py-5 text-base md:text-lg"
                  : "px-3 py-3 text-sm"
              }`}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className={`shrink-0 bg-signal hover:bg-signal-deep text-white font-semibold uppercase tracking-wider transition-colors ${
                large
                  ? "px-5 md:px-7 text-sm"
                  : "px-4 text-xs"
              }`}
            >
              {t.searchSubmit}
            </button>
          </div>
        </div>
      </div>
      {large ? (
        <p className="mt-3 font-mono text-[11px] text-ink-faint tracking-wide">
          {t.searchHint}
        </p>
      ) : null}
    </form>
  );
}
