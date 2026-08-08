"use client";

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import CartButton from "@/components/CartButton";

type HeaderProps = {
  /** hero = transparent over home hero; solid = always solid (inner pages) */
  variant?: "hero" | "solid";
};

export default function Header({ variant = "hero" }: HeaderProps) {
  const { t, locale, setLocale } = useLanguage();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(variant === "solid");
  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 80],
    variant === "solid"
      ? ["rgba(238, 241, 244, 0.96)", "rgba(238, 241, 244, 0.96)"]
      : ["rgba(238, 241, 244, 0)", "rgba(238, 241, 244, 0.96)"]
  );
  const headerBorder = useTransform(
    scrollY,
    [0, 80],
    variant === "solid"
      ? ["rgba(22,26,32,0.08)", "rgba(22,26,32,0.08)"]
      : ["rgba(22,26,32,0)", "rgba(22,26,32,0.08)"]
  );

  useMotionValueEvent(scrollY, "change", (v) => {
    if (variant === "solid") {
      setScrolled(true);
      return;
    }
    setScrolled(v > 48);
  });

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const onHero = variant === "hero" && !scrolled && !mobileOpen;
  const linkClass = onHero
    ? "text-white/70 hover:text-white"
    : "text-ink-muted hover:text-ink";
  const brandClass = onHero ? "text-white" : "text-ink";
  const activeLang = onHero
    ? "text-white font-semibold"
    : "text-signal font-semibold";
  const idleLang = onHero
    ? "text-white/50 hover:text-white/80"
    : "text-ink-faint hover:text-ink";

  const sectionHref = (hash: string) => (isHome ? hash : `/${hash}`);

  const navItems = [
    { href: "/katalogu", key: "navCatalogue" as const, isRoute: true },
    { href: sectionHref("#about"), key: "navAbout" as const, isRoute: false },
    { href: sectionHref("#contact"), key: "navContact" as const, isRoute: false },
  ];

  const isActive = (href: string, isRoute: boolean) => {
    if (!isRoute) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-4 sm:px-6 md:px-8 lg:px-12"
      style={{
        backgroundColor: mobileOpen ? "rgba(238, 241, 244, 0.98)" : headerBg,
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: headerBorder,
        backdropFilter:
          scrolled || mobileOpen || variant === "solid" ? "blur(10px)" : "none",
      }}
    >
      <div className="relative flex items-center justify-between gap-3 container mx-auto min-h-11">
        <Link
          href="/"
          className={`flex items-center gap-2 sm:gap-3 min-w-0 transition-opacity hover:opacity-80 ${
            mobileOpen ? "text-ink" : brandClass
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/logo.png"
            alt="AUTO SHABANI"
            width={44}
            height={44}
            className="object-contain flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11"
            priority
          />
          <span
            className={`truncate text-[11px] sm:text-sm md:text-base font-ethnocentric tracking-[0.12em] sm:tracking-brand uppercase ${
              mobileOpen ? "text-ink" : brandClass
            }`}
          >
            {t.brandName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 lg:gap-10 ml-auto">
          {navItems.map(({ href, key, isRoute }) => {
            const active = isActive(href, isRoute);
            const className = `text-xs tracking-widest uppercase transition-colors py-2 ${
              active
                ? onHero
                  ? "text-white font-semibold"
                  : "text-signal font-semibold"
                : linkClass
            }`;
            return isRoute ? (
              <Link key={key} href={href} className={className}>
                {t[key]}
              </Link>
            ) : (
              <a key={key} href={href} className={className}>
                {t[key]}
              </a>
            );
          })}
          <div
            className={`flex items-center gap-1 border-l pl-5 ml-1 ${
              onHero ? "border-white/25" : "border-steel-light"
            }`}
          >
            <CartButton onDark={onHero} />
            {(["sq", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`min-h-9 min-w-9 text-xs tracking-widest uppercase transition-colors ${
                  locale === lang ? activeLang : idleLang
                }`}
                aria-label={lang === "sq" ? "Shqip" : "English"}
                aria-pressed={locale === lang}
              >
                {lang === "sq" ? "SQ" : "EN"}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-0.5 md:hidden shrink-0">
          <CartButton onDark={onHero && !mobileOpen} />
          {(["sq", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLocale(lang)}
              className={`min-h-11 min-w-9 px-1.5 text-xs tracking-widest uppercase transition-colors ${
                locale === lang
                  ? mobileOpen
                    ? "text-signal font-semibold"
                    : activeLang
                  : mobileOpen
                    ? "text-ink-faint"
                    : idleLang
              }`}
              aria-label={lang === "sq" ? "Shqip" : "English"}
              aria-pressed={locale === lang}
            >
              {lang === "sq" ? "SQ" : "EN"}
            </button>
          ))}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className={`min-h-11 min-w-11 inline-flex items-center justify-center transition-colors ${
              mobileOpen
                ? "text-ink"
                : onHero
                  ? "text-white/85 hover:text-white"
                  : "text-ink-muted hover:text-ink"
            }`}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-ink/8 shadow-[0_12px_32px_-12px_rgba(22,26,32,0.25)]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col py-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              {navItems.map(({ href, key, isRoute }) => {
                const className =
                  "min-h-12 flex items-center px-4 text-sm tracking-widest uppercase text-ink hover:bg-surface-alt transition-colors";
                return isRoute ? (
                  <Link
                    key={key}
                    href={href}
                    className={className}
                    onClick={() => setMobileOpen(false)}
                  >
                    {t[key]}
                  </Link>
                ) : (
                  <a
                    key={key}
                    href={href}
                    className={className}
                    onClick={() => setMobileOpen(false)}
                  >
                    {t[key]}
                  </a>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
