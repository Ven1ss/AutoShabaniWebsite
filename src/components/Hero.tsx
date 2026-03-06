"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-black-deep bg-hero-pattern"
    >
      {/* Parallax layer */}
      <motion.div
        className="absolute inset-0 bg-hero-pattern opacity-80 pointer-events-none"
        style={{ y }}
        aria-hidden
      />
      {/* Abstract mechanical texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative z-10 container mx-auto px-6 md:px-8 lg:px-12 pt-24 pb-32 flex flex-col items-center justify-center text-center">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.12, delayChildren: 0.2 },
            },
            hidden: {},
          }}
        >
          <motion.p
            className="text-accent-red text-sm md:text-base tracking-[0.2em] mb-6"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.heroTagline}
          </motion.p>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight text-white leading-[1.05]"
            variants={{
              hidden: { opacity: 0, y: 28 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.heroTitle1}
            <br />
            {t.heroTitle2}
            <br />
            <span className="text-white/90">{t.heroTitle3}</span>
          </motion.h1>

          <motion.p
            className="mt-8 text-lg md:text-xl text-white/70 max-w-xl mx-auto"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.heroSubtitle}
          </motion.p>

          <motion.div
            className="mt-12 flex justify-center"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <a
              href="#about"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-red text-white text-sm font-medium tracking-wider uppercase transition-all duration-300 btn-glow rounded-sm hover:bg-accent-red/90"
            >
              {t.heroCta}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-black-deep to-transparent"
        aria-hidden
      />
    </section>
  );
}
