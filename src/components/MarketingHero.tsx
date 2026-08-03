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
      {/* Steel mesh / animated gradient — no photography required */}
      <div className="absolute inset-0 hero-mesh" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" aria-hidden />

      <div className="relative z-10 container mx-auto px-6 md:px-8 lg:px-12 pt-28 pb-10 md:pb-14 flex flex-col flex-1 justify-end">
        <div className="max-w-3xl">
          <p className="font-ethnocentric text-lg sm:text-xl md:text-2xl tracking-brand text-white mb-5">
            {t.brandName}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold uppercase tracking-tight text-white leading-[0.95]">
            {t.heroTitle1} {t.heroTitle2}
            <br />
            <span className="text-white/90">{t.heroTitle3}</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/80 max-w-md leading-relaxed">
            {t.heroSubtitle}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/katalogu"
              className="inline-flex items-center justify-center gap-2 bg-signal hover:bg-signal-deep text-white text-sm font-semibold tracking-wider uppercase px-7 py-3.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t.heroCtaPrimary}
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/45 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold tracking-wider uppercase px-7 py-3.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t.heroCtaSecondary}
            </a>
          </div>
        </div>

        <div className="mt-14 md:mt-16 pt-8 border-t border-white/15">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/55 mb-5">
            {t.brandsHeading}
          </p>
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-4 md:gap-x-9">
            {PARTNER_BRANDS.map((brand) => (
              <li key={brand.name}>
                <Image
                  src={brand.src}
                  alt={brand.name}
                  width={120}
                  height={40}
                  className="h-6 md:h-7 w-auto max-w-[100px] object-contain brightness-0 invert opacity-70"
                  unoptimized
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
