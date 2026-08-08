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
      <div className="overflow-hidden rounded-xl border border-steel-light bg-as-white">
        <div className="flex items-stretch">
          <div className="flex flex-1 min-w-0 items-stretch">
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
              className={`w-full min-w-0 bg-transparent text-as-dark placeholder:text-as-gray outline-none text-base ${
                large ? "px-4 py-3.5 sm:px-5 sm:py-4" : "px-3.5 py-3"
              }`}
              autoComplete="off"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
            <button
              type="submit"
              className={`shrink-0 min-h-12 bg-accent hover:bg-accent-deep active:bg-accent-deep text-white font-medium transition-colors ${
                large
                  ? "px-5 sm:px-7 text-sm"
                  : "px-4 sm:px-5 text-sm"
              }`}
            >
              {t.searchSubmit}
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-caption text-as-gray px-0.5 sm:hidden">
        {t.searchHint}
      </p>
    </form>
  );
}
