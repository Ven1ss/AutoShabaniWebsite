"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import CartButton from "@/components/CartButton";

type Props = {
  /** Over a dark hero — white text until scrolled */
  overDark?: boolean;
};

/**
 * Apple-style sticky nav: transparent over hero, solid + blur on scroll.
 */
export default function SiteNav({ overDark = false }: Props) {
  const { t, locale, setLocale } = useLanguage();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!overDark);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overDark) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overDark]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open || !overDark;
  const onDark = overDark && !solid;

  const linkBase = onDark
    ? "text-white/80 hover:text-white"
    : "text-as-secondary hover:text-as-dark";
  const brandCls = onDark ? "text-white" : "text-as-dark";

  const sectionHref = (hash: string) => (isHome ? hash : `/${hash}`);

  const items = [
    { href: "/katalogu", label: t.navCatalogue, route: true },
    { href: sectionHref("#about"), label: t.navAbout, route: false },
    { href: sectionHref("#contact"), label: t.navContact, route: false },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-motion ease-apple ${
        solid
          ? "border-b border-black/5 bg-as-snow/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container-as flex min-h-12 items-center justify-between gap-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className={`flex min-w-0 items-center gap-2.5 ${brandCls}`}
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
            priority
          />
          <span className="truncate font-ethnocentric text-[10px] sm:text-xs tracking-brand uppercase">
            {t.brandName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {items.map((item) =>
            item.route ? (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm transition-colors duration-motion-fast ${
                  pathname.startsWith("/katalogu") && item.href === "/katalogu"
                    ? onDark
                      ? "text-white font-medium"
                      : "text-accent font-medium"
                    : linkBase
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className={`text-sm transition-colors duration-motion-fast ${linkBase}`}
              >
                {item.label}
              </a>
            )
          )}
          <div
            className={`flex items-center gap-1 border-l pl-5 ${
              onDark ? "border-white/20" : "border-as-mist"
            }`}
          >
            <CartButton
              onDark={onDark}
              className={onDark ? "" : "text-as-secondary hover:text-as-dark"}
            />
            {(["sq", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`min-h-9 min-w-9 text-xs uppercase tracking-wider ${
                  locale === lang
                    ? onDark
                      ? "text-white font-semibold"
                      : "text-accent font-semibold"
                    : onDark
                      ? "text-white/45"
                      : "text-as-gray"
                }`}
                aria-pressed={locale === lang}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex items-center md:hidden">
          <CartButton
            onDark={onDark && !open}
            className={
              open || solid
                ? "text-as-secondary hover:text-as-dark"
                : undefined
            }
          />
          {(["sq", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLocale(lang)}
              className={`min-h-11 min-w-9 text-xs uppercase ${
                locale === lang
                  ? open || solid
                    ? "text-accent font-semibold"
                    : onDark
                      ? "text-white font-semibold"
                      : "text-accent font-semibold"
                  : open || solid
                    ? "text-as-gray"
                    : onDark
                      ? "text-white/45"
                      : "text-as-gray"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            aria-label={open ? "Close" : "Menu"}
            aria-expanded={open}
            className={`min-h-11 min-w-11 inline-flex items-center justify-center ${
              open || solid ? "text-as-dark" : onDark ? "text-white" : "text-as-dark"
            }`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="md:hidden border-t border-black/5 bg-as-snow">
          <nav className="container-as flex flex-col py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {items.map((item) =>
              item.route ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="min-h-12 flex items-center text-base text-as-dark"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="min-h-12 flex items-center text-base text-as-dark"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              )
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
