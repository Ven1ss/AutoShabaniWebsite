"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

const ease = [0.16, 1, 0.3, 1] as const;

export default function TrustStrip() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const items = [
    { title: t.trust1Title, desc: t.trust1Desc },
    { title: t.trust2Title, desc: t.trust2Desc },
    { title: t.trust3Title, desc: t.trust3Desc },
  ];

  return (
    <section
      id="about"
      ref={ref}
      className="py-12 md:py-16 border-y border-steel-light/70 bg-surface-alt"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, ease }}
        >
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-signal font-semibold mb-6">
            {t.trustHeading}
          </p>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {items.map((item) => (
              <div key={item.title}>
                <h2 className="font-display text-xl font-semibold uppercase tracking-tight text-ink mb-2">
                  {item.title}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-steel-light/60 max-w-2xl">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-tight text-ink mb-3">
              {t.aboutTitle}
            </h2>
            <p className="text-sm md:text-base text-ink-muted leading-relaxed">
              {t.aboutText}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
