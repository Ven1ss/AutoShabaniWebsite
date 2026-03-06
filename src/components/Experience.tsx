"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

const iconShield = (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
);

const iconBulb = (
  <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
);

const iconBolt = (
  <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
);

const iconPeople = (
  <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
);

export default function Experience() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const items = [
    { titleKey: "exp1Title" as const, descKey: "exp1Desc" as const, icon: iconShield },
    { titleKey: "exp2Title" as const, descKey: "exp2Desc" as const, icon: iconBulb },
    { titleKey: "exp3Title" as const, descKey: "exp3Desc" as const, icon: iconBolt },
    { titleKey: "exp4Title" as const, descKey: "exp4Desc" as const, icon: iconPeople },
  ];

  return (
    <section
      id="experience"
      ref={ref}
      className="relative py-24 md:py-32 lg:py-40 bg-black-deep"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <motion.p
          className="text-center text-sm tracking-[0.3em] uppercase text-white/50 mb-6"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {t.experienceLabel}
        </motion.p>
        <motion.h2
          className="text-center text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-20"
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {t.experienceTitle}
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {items.map((item, i) => (
            <motion.article
              key={item.titleKey}
              className="group relative p-8 rounded-lg border border-white/5 bg-black-card/30 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/10 hover:bg-black-card/50 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4),0_0_30px_-8px_rgba(196,30,58,0.2)] overflow-hidden"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.96 }}
              transition={{
                duration: 0.8,
                delay: 0.15 + i * 0.09,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Shine sweep on hover */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
                aria-hidden
              >
                <div
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), rgba(255,255,255,0.08), rgba(255,255,255,0.06), transparent)",
                    width: "60%",
                  }}
                />
              </div>
              <div className="relative z-10 text-accent-red mb-6 opacity-90 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t[item.titleKey]}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {t[item.descKey]}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
