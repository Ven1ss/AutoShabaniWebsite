"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import type { CartProductInput } from "@/lib/cart";

type Props = {
  product: CartProductInput;
  /** Compact icon-style for product cards */
  compact?: boolean;
  /** Full-width primary CTA for product detail */
  size?: "default" | "lg";
  className?: string;
};

function CartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

export default function AddToCartButton({
  product,
  compact = false,
  size = "default",
  className = "",
}: Props) {
  const { t } = useLanguage();
  const { addItem, items } = useCart();
  const inCart = items.some((item) => item.slug === product.slug);

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addItem(product);
        }}
        aria-label={t.cartAdd}
        title={t.cartAdd}
        className={`inline-flex min-h-9 min-w-9 items-center justify-center border border-steel-light bg-as-white text-as-dark hover:border-accent hover:text-accent transition-colors ${className}`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>
    );
  }

  const large = size === "lg";

  return (
    <button
      type="button"
      onClick={() => addItem(product)}
      className={`inline-flex items-center justify-center gap-2.5 rounded-control bg-accent text-white font-medium transition-all duration-motion-fast ease-apple hover:bg-accent-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        large
          ? "min-h-[var(--control-h)] w-full px-[clamp(1.25rem,1rem+1vw,1.75rem)] text-button"
          : "min-h-[var(--control-h)] w-full sm:w-auto px-[clamp(1.1rem,0.9rem+0.8vw,1.5rem)] text-sm tracking-wider uppercase font-semibold"
      } ${className}`}
    >
      <CartIcon className={large ? "h-5 w-5" : "h-4 w-4"} />
      <span>{inCart ? t.cartAdded : t.cartAdd}</span>
      {inCart ? (
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold tabular-nums normal-case tracking-normal">
          +1
        </span>
      ) : null}
    </button>
  );
}
