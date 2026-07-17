"use client";

import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from "framer-motion";
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
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(244, 246, 248, 0)", "rgba(244, 246, 248, 0.94)"]
  );
  const headerBorder = useTransform(
    scrollY,
    [0, 80],
    ["rgba(18,21,26,0)", "rgba(18,21,26,0.08)"]
  );

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 48);
  });

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

  const onHero = !scrolled && !mobileOpen;
  const linkClass = onHero
    ? "text-white/70 hover:text-white"
    : "text-ink-muted hover:text-ink";
  const brandClass = onHero ? "text-white" : "text-ink";
  const activeLang = onHero ? "text-white font-semibold" : "text-signal font-semibold";
  const idleLang = onHero ? "text-white/50 hover:text-white/80" : "text-ink-faint hover:text-ink";

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 py-5 px-6 md:px-8 lg:px-12"
      style={{
        backgroundColor: mobileOpen ? "rgba(244, 246, 248, 0.98)" : headerBg,
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: headerBorder,
        backdropFilter: scrolled || mobileOpen ? "blur(10px)" : "none",
      }}
    >
      <div className="relative flex items-center justify-between container mx-auto">
        <a
          href="#hero"
          className={`flex items-center gap-3 transition-opacity hover:opacity-80 ${mobileOpen ? "text-ink" : brandClass}`}
        >
          <Image
            src="/logo.png"
            alt="AUTO SHABANI"
            width={56}
            height={56}
            className="object-contain flex-shrink-0"
            priority
          />
          <span
            className={`text-sm md:text-base font-ethnocentric tracking-brand uppercase ${
              mobileOpen ? "text-ink" : brandClass
            }`}
          >
            {t.brandName}
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-10 ml-auto">
          {navKeys.map(({ href, key }) => (
            <a
              key={href}
              href={href}
              className={`text-xs tracking-widest uppercase transition-colors ${linkClass}`}
            >
              {t[key]}
            </a>
          ))}
          <div
            className={`flex items-center gap-1 border-l pl-6 ml-2 ${
              onHero ? "border-white/25" : "border-steel-light"
            }`}
          >
            {(["sq", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`text-xs tracking-widest uppercase transition-colors px-1.5 ${
                  locale === lang ? activeLang : idleLang
                }`}
                aria-label={lang === "sq" ? "Shqip" : "English"}
              >
                {lang === "sq" ? "SQ" : "EN"}
              </button>
            ))}
          </div>
        </nav>
        <div className="flex items-center gap-3 md:gap-2">
          <div className="flex md:hidden items-center gap-1">
            {(["sq", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`text-xs tracking-widest uppercase transition-colors ${
                  locale === lang
                    ? mobileOpen
                      ? "text-signal font-semibold"
                      : activeLang
                    : mobileOpen
                      ? "text-ink-faint"
                      : idleLang
                }`}
              >
                {lang === "sq" ? "SQ" : "EN"}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Toggle menu"
            className={`md:hidden p-2 transition-colors ${
              mobileOpen ? "text-ink" : onHero ? "text-white/80 hover:text-white" : "text-ink-muted hover:text-ink"
            }`}
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
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-ink/5"
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
                  className="text-sm tracking-widest uppercase text-ink-muted hover:text-ink transition-colors"
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
