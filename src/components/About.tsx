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
      className="relative py-24 md:py-32 lg:py-40 bg-black-deep overflow-hidden"
    >
      {/* Subtle ambient glow — fades in when section is in view */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "radial-gradient(ellipse 70% 40% at 50% 50%, rgba(196, 30, 58, 0.04) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <div className="container relative z-10 mx-auto px-6 md:px-8 lg:px-12">
        {/* Top divider — draws from center */}
        <motion.div
          className="h-px w-full max-w-2xl mx-auto mb-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "center" }}
        />

        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 48, scale: 0.98 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 48, scale: 0.98 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative inline-block pb-5">
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight"
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {t.aboutTitle1}
              <br />
              <span className="text-white/90">{t.aboutTitle2}</span>
            </motion.h2>
            {/* Accent line under headline — draws in after text */}
            <motion.div
              className="absolute left-1/2 top-full mt-3 h-px w-full max-w-xs -translate-x-1/2 bg-gradient-to-r from-transparent via-accent-red/80 to-transparent"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "center" }}
            />
          </div>
          <motion.p
            className="mt-10 text-lg md:text-xl text-white/60 leading-relaxed"
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.aboutText}
          </motion.p>
        </motion.div>

        <motion.div
          className="h-px w-full max-w-2xl mx-auto mt-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "center" }}
        />
      </div>
    </section>
  );
}
