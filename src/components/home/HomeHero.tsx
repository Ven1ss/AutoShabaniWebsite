"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";
import FadeIn from "@/components/ui/FadeIn";
import { useLanguage } from "@/context/LanguageContext";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=2400&q=80";

/**
 * Full-viewport brand hero — one idea, one CTA, no search/grid clutter.
 */
export default function HomeHero() {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden bg-as-black text-white"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative z-10 container-as pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(7rem,calc(env(safe-area-inset-top)+5.5rem))] sm:pb-16 md:pb-20">
        <FadeIn y={20}>
          <p className="font-ethnocentric text-sm sm:text-base tracking-brand text-white/90 mb-4 sm:mb-6">
            {t.brandName}
          </p>
          <h1 className="text-hero text-white max-w-4xl">
            {t.heroTitle1}
            <br />
            {t.heroTitle2}
            <br />
            <span className="text-white/85">{t.heroTitle3}</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-subhead text-white/75 max-w-md">
            {t.heroSubtitle}
          </p>
          <div className="mt-8 sm:mt-10">
            <Button href="/katalogu" variant="primary" tone="dark" className="min-w-[12rem]">
              {t.heroCtaPrimary}
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
