"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

const brands = [
  "BOSCH",
  "BREMBO",
  "CONTINENTAL",
  "DENSO",
  "GATES",
  "MAHLE",
  "MANN-FILTER",
  "SKF",
  "VALEO",
  "ZF",
];

export default function Brands() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="brands"
      ref={ref}
      className="relative py-24 md:py-32 bg-black-softer"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <motion.p
          className="text-center text-sm tracking-[0.3em] uppercase text-white/50 mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {t.brandsHeading}
        </motion.p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {brands.map((brand, i) => (
            <motion.div
              key={brand}
              className="group relative flex items-center justify-center py-6 px-4 rounded-lg border border-white/5 bg-black-card/50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/10 hover:bg-black-card hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_rgba(196,30,58,0.15)] overflow-hidden"
              initial={{ opacity: 0, y: 36, scale: 0.94 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 36, scale: 0.94 }}
              transition={{
                duration: 0.75,
                delay: i * 0.055,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Shine sweep on hover */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg" aria-hidden>
                <div
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), rgba(255,255,255,0.08), rgba(255,255,255,0.05), transparent)",
                    width: "60%",
                  }}
                />
              </div>
              <span className="relative z-10 text-sm md:text-base font-medium text-white/70 tracking-widest group-hover:text-white transition-colors duration-300">
                {brand}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
