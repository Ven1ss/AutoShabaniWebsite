"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Vision() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const gradientY = useTransform(scrollYProgress, [0, 0.5, 1], ["0%", "8%", "0%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.3, 0.5, 0.5, 0.3]);

  return (
    <section
      id="vision"
      ref={ref}
      className="relative py-24 md:py-32 lg:py-40 bg-black-softer overflow-hidden"
    >
      {/* Parallax gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(196, 30, 58, 0.08), transparent 70%)",
          y: gradientY,
          opacity,
        }}
      />

      <div className="container relative z-10 mx-auto px-6 md:px-8 lg:px-12">
        <motion.blockquote
          className="max-w-5xl mx-auto text-center"
          initial={{ opacity: 0, y: 48, scale: 0.98 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 48, scale: 0.98 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight text-white leading-[1.15]">
            {t.visionQuote}
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
}
