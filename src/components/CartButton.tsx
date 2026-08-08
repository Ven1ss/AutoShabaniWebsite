"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  /** Match nav text on dark heroes */
  onDark?: boolean;
  className?: string;
};

export default function CartButton({ onDark = false, className = "" }: Props) {
  const { t } = useLanguage();
  const { itemCount, hydrated, openCart } = useCart();
  const count = hydrated ? itemCount : 0;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`${t.cartOpen}${count > 0 ? ` (${count})` : ""}`}
      className={`relative inline-flex min-h-11 min-w-11 items-center justify-center transition-colors ${
        onDark
          ? "text-white/85 hover:text-white"
          : "text-ink-muted hover:text-ink"
      } ${className}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h10.035a1.125 1.125 0 0 0 1.087-.835l1.858-6.957a.75.75 0 0 0-.724-.933H5.29M7.5 14.25 5.856 5.272M7.5 14.25l-1.028 4.11a1.125 1.125 0 0 0 1.087 1.39h9.191M16.5 18.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm-8.25 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {count > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-white tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
