"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function About() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="about"
      ref={ref}
      className="relative py-24 md:py-32 lg:py-36 bg-surface bg-surface-noise overflow-hidden"
    >
      <div className="container relative z-10 mx-auto px-6 md:px-8 lg:px-12">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs tracking-[0.28em] uppercase text-signal font-semibold mb-5">
            {t.heroTagline}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold uppercase tracking-tight text-ink leading-[1.05]">
            {t.aboutTitle1}
            <br />
            <span className="text-steel">{t.aboutTitle2}</span>
          </h2>
          <div className="mt-8 h-px w-16 bg-signal" />
          <p className="mt-8 text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
            {t.aboutText}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
