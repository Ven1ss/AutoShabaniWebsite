"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

const navKeys = [
  { href: "#about", key: "navAbout" as const },
  { href: "#experience", key: "navExperience" as const },
  { href: "#contact", key: "navContact" as const },
];

export default function Header() {
  const { t, locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(11, 11, 11, 0)", "rgba(11, 11, 11, 0.9)"]
  );
  const headerBorder = useTransform(
    scrollY,
    [0, 80],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)"]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (!mounted) return null;

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 py-6 px-6 md:px-8 lg:px-12"
      style={{
        backgroundColor: headerBg,
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: headerBorder,
      }}
    >
      <div className="relative flex items-center justify-between container mx-auto">
        <a
          href="#hero"
          className="flex items-center gap-4 text-white hover:opacity-90 transition-opacity"
        >
          <Image
            src="/logo.png"
            alt="AUTO SHABANI"
            width={56}
            height={56}
            className="object-contain flex-shrink-0"
            priority
          />
          <span className="text-base md:text-lg font-ethnocentric tracking-[0.25em] uppercase">
            {t.brandName}
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-10 ml-auto">
          {navKeys.map(({ href, key }) => (
            <a
              key={href}
              href={href}
              className="text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors"
            >
              {t[key]}
            </a>
          ))}
          <div className="flex items-center gap-1 border-l border-white/20 pl-6 ml-2">
            {(["sq", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`text-xs tracking-widest uppercase transition-colors ${
                  locale === lang ? "text-white font-medium" : "text-white/50 hover:text-white/80"
                }`}
                aria-label={lang === "sq" ? "Shqip" : "English"}
              >
                {lang === "sq" ? "SQ" : "EN"}
              </button>
            ))}
          </div>
        </nav>
        <div className="flex items-center gap-4 md:gap-2">
          <div className="flex md:hidden items-center gap-1">
            {(["sq", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`text-xs tracking-widest uppercase transition-colors ${
                  locale === lang ? "text-white font-medium" : "text-white/50"
                }`}
              >
                {lang === "sq" ? "SQ" : "EN"}
              </button>
            ))}
          </div>
        <button
          type="button"
          aria-label="Toggle menu"
          className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        </div>
      </div>
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
        <motion.div
          className="md:hidden absolute top-full left-0 right-0 bg-black-deep/98 backdrop-blur-md border-b border-white/5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <nav className="flex flex-col py-6 px-6 gap-6">
            {navKeys.map(({ href, key }) => (
              <a
                key={href}
                href={href}
                className="text-sm tracking-widest uppercase text-white/70 hover:text-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {t[key]}
              </a>
            ))}
          </nav>
        </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
