"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { CONTACT } from "@/lib/contact";
import { PARTNER_BRANDS } from "@/lib/brands";

export default function MarketingHero() {
  const { t, locale } = useLanguage();
  const whatsappHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    locale === "sq"
      ? "Përshëndetje AUTO SHABANI, dua të kontaktoj."
      : "Hello AUTO SHABANI, I would like to get in touch."
  )}`;

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden bg-ink text-white"
    >
      <div className="absolute inset-0 hero-mesh" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/45"
        aria-hidden
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-10 md:pb-14 flex flex-col flex-1 justify-end">
        <div className="max-w-3xl">
          <p className="font-ethnocentric text-sm sm:text-lg md:text-2xl tracking-[0.14em] sm:tracking-brand text-white mb-3 sm:mb-5">
            {t.brandName}
          </p>
          <h1 className="font-display text-[2.65rem] leading-[0.95] sm:text-6xl md:text-7xl lg:text-8xl font-semibold uppercase tracking-tight text-white">
            <span className="block sm:inline">{t.heroTitle1}</span>{" "}
            <span className="block sm:inline">{t.heroTitle2}</span>
            <br className="hidden sm:block" />
            <span className="block sm:inline text-white/90">{t.heroTitle3}</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-[0.95rem] sm:text-base md:text-lg text-white/80 max-w-md leading-relaxed">
            {t.heroSubtitle}
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col xs:flex-row sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <Link
              href="/katalogu"
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 bg-signal hover:bg-signal-deep active:bg-signal-deep text-white text-sm font-semibold tracking-wider uppercase px-7 py-3.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t.heroCtaPrimary}
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 border border-white/45 bg-white/5 hover:bg-white/10 active:bg-white/10 text-white text-sm font-semibold tracking-wider uppercase px-7 py-3.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t.heroCtaSecondary}
            </a>
          </div>
        </div>

        <div className="mt-10 sm:mt-14 md:mt-16 pt-6 sm:pt-8 border-t border-white/15">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/55 mb-4 sm:mb-5">
            {t.brandsHeading}
          </p>
          {/* Horizontal scroll on small screens — avoids cramped wrap */}
          <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto overscroll-x-contain scrollbar-none">
            <ul className="flex items-center gap-6 sm:gap-x-8 md:gap-x-9 sm:flex-wrap min-w-max sm:min-w-0 pb-1">
              {PARTNER_BRANDS.map((brand) => (
                <li key={brand.name} className="shrink-0">
                  <Image
                    src={brand.src}
                    alt={brand.name}
                    width={120}
                    height={40}
                    className="h-5 sm:h-6 md:h-7 w-auto max-w-[88px] sm:max-w-[100px] object-contain brightness-0 invert opacity-70"
                    unoptimized
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
