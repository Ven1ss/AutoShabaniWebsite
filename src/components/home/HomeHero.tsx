"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";
import FadeIn from "@/components/ui/FadeIn";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Compact brand hero — real local asset, then catalogue takes over the page.
 */
export default function HomeHero() {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative min-h-[min(72svh,36rem)] flex flex-col justify-end overflow-hidden bg-as-dark text-white"
    >
      <Image
        src="/hero-car.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_40%]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-as-dark via-as-dark/70 to-as-dark/35"
        aria-hidden
      />

      <div className="relative z-10 container-as pb-8 pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] sm:pb-10">
        <FadeIn y={16}>
          <p className="font-ethnocentric text-xs sm:text-sm tracking-brand text-white/90 mb-3">
            {t.brandName}
          </p>
          <h1 className="text-[clamp(1.75rem,1.2rem+2.8vw,3.25rem)] font-semibold tracking-[-0.03em] text-white max-w-2xl leading-[1.1]">
            {t.heroSubtitle}
          </h1>
          <p className="mt-3 text-body text-white/70 max-w-md">
            {t.heroTradeNote}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              href="/katalogu"
              variant="primary"
              tone="dark"
              className="min-w-[11rem]"
            >
              {t.heroCtaPrimary}
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
