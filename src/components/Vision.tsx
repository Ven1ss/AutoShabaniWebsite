"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Vision() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="vision"
      ref={ref}
      className="relative py-24 md:py-32 lg:py-40 bg-ink text-white overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 80% 20%, rgba(200,16,46,0.35), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="container relative z-10 mx-auto px-6 md:px-8 lg:px-12">
        <motion.blockquote
          className="max-w-4xl"
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="h-1 w-14 bg-signal mb-10" />
          <p className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-semibold uppercase tracking-tight leading-[1.12] text-white">
            {t.visionQuote}
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
}
