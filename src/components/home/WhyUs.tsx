"use client";

import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";

/** Spacious “why us” value props — one clear idea each. */
export default function WhyUs() {
  const { t } = useLanguage();

  const items = [
    { title: t.trust1Title, desc: t.trust1Desc },
    { title: t.trust2Title, desc: t.trust2Desc },
    { title: t.trust3Title, desc: t.trust3Desc },
    { title: t.trust4Title, desc: t.trust4Desc },
  ];

  return (
    <section id="about" className="surface-light section-pad">
      <div className="container-as">
        <FadeIn>
          <SectionHeading
            eyebrow={t.trustHeading}
            title={t.aboutTitle}
            subhead={t.aboutText}
            className="mb-14 md:mb-20"
          />
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8 max-w-shelf mx-auto">
          {items.map((item, i) => (
            <FadeIn key={item.title} delay={0.04 * i}>
              <article className="h-full rounded-media bg-as-white p-8 sm:p-10 md:p-12">
                <p className="text-caption font-semibold text-accent mb-4 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-[1.375rem] sm:text-2xl font-semibold tracking-tight text-as-dark leading-snug mb-3">
                  {item.title}
                </h3>
                <p className="text-body text-as-secondary leading-relaxed">
                  {item.desc}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
