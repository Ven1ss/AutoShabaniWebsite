"use client";

import Image from "next/image";
import FadeIn from "@/components/ui/FadeIn";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Brand-first full-bleed hero: brand + headline + one line + catalogue CTA.
 * Search sits just below in HomeSearchStrip.
 */
export default function HomeHero() {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative min-h-[min(52svh,24rem)] sm:min-h-[min(62svh,30rem)] flex flex-col justify-end overflow-hidden bg-as-dark text-white"
    >
      <Image
        src="/hero-car.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_38%]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-as-dark via-as-dark/75 to-as-dark/40"
        aria-hidden
      />

      <div className="relative z-10 container-as pb-10 pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] sm:pb-12">
        <FadeIn y={14}>
          <p className="font-ethnocentric text-2xl sm:text-3xl md:text-4xl tracking-brand text-white mb-3 sm:mb-4">
            {t.brandName}
          </p>
          <h1 className="max-w-xl text-[1.35rem] sm:text-2xl md:text-[1.75rem] font-semibold tracking-tight text-white/95 leading-snug">
            {t.heroSubtitle}
          </h1>
          <p className="mt-3 max-w-md text-sm sm:text-body text-white/70">
            {t.heroTradeNote}
          </p>
          <div className="mt-5 sm:mt-6">
            <Button href="/katalogu" variant="primary" tone="dark">
              {t.heroCtaPrimary}
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
