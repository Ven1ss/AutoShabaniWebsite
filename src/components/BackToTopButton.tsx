"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  /** Lift above the mobile sticky enquire/cart bar on product pages. */
  aboveMobileSticky?: boolean;
};

const SHOW_AFTER_PX = 400;

export default function BackToTopButton({ aboveMobileSticky = false }: Props) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t.backToTop}
      className={`fixed right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-as-dark text-white shadow-card transition-opacity hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:right-6 ${
        aboveMobileSticky
          ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6"
          : "bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:bottom-6"
      }`}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="m6 14 6-6 6 6"
        />
      </svg>
    </button>
  );
}
