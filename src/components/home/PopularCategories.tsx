"use client";

import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";
import { POPULAR_CATEGORIES } from "@/lib/popular-categories";
import { useLanguage } from "@/context/LanguageContext";
import { trackEvent } from "@/lib/analytics";

export default function PopularCategories() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-black/[0.04] bg-as-white">
      <div className="container-as py-10 sm:py-12 md:py-14">
        <FadeIn>
          <div className="mb-6 sm:mb-8 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-as-dark">
              {t.popCategoriesTitle}
            </h2>
            <p className="mt-2 text-sm text-as-secondary">{t.popCategoriesSub}</p>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {POPULAR_CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/katalogu?q=${encodeURIComponent(cat.q)}`}
                  onClick={() =>
                    trackEvent("popular_category", { id: cat.id })
                  }
                  className="flex min-h-[3rem] items-center justify-center rounded-sm border border-as-mist bg-as-snow px-3 py-3 text-center text-sm font-medium text-as-dark transition-colors hover:border-as-dark/20 hover:bg-as-white active:bg-as-mist"
                >
                  {t[cat.labelKey]}
                </Link>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
