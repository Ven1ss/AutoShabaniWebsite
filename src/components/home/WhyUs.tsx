"use client";

import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";

/** Local trust — short facts, not icon marketing cards. */
export default function WhyUs() {
  const { t } = useLanguage();

  const items = [
    { title: t.trust1Title, desc: t.trust1Desc },
    { title: t.trust2Title, desc: t.trust2Desc },
    { title: t.trust3Title, desc: t.trust3Desc },
    { title: t.trust4Title, desc: t.trust4Desc },
  ];

  return (
    <section id="about" className="section-pad bg-as-snow">
      <div className="container-as">
        <FadeIn>
          <SectionHeading
            title={t.aboutTitle}
            subhead={t.aboutText}
            align="left"
            className="mb-10 md:mb-14"
          />
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8 max-w-shelf">
          {items.map((item, i) => (
            <FadeIn key={item.title} delay={0.03 * i}>
              <article className="border-t border-steel-light pt-5">
                <h3 className="text-lg font-semibold tracking-tight text-as-dark mb-2">
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
