"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function TrustStrip() {
  const { t } = useLanguage();

  const items = [
    { title: t.trust1Title, desc: t.trust1Desc },
    { title: t.trust2Title, desc: t.trust2Desc },
    { title: t.trust3Title, desc: t.trust3Desc },
  ];

  return (
    <section
      id="about"
      className="py-10 sm:py-12 md:py-16 border-y border-steel-light/70 bg-surface-alt"
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-signal font-semibold mb-5 sm:mb-6">
          {t.trustHeading}
        </p>
        <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          {items.map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-lg sm:text-xl font-semibold uppercase tracking-tight text-ink mb-2">
                {item.title}
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-steel-light/60 max-w-2xl">
          <h2 className="font-display text-xl sm:text-2xl font-semibold uppercase tracking-tight text-ink mb-3">
            {t.aboutTitle}
          </h2>
          <p className="text-sm md:text-base text-ink-muted leading-relaxed">
            {t.aboutText}
          </p>
        </div>
      </div>
    </section>
  );
}
