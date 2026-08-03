"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="relative border-t border-steel-light bg-surface py-8 sm:py-10 md:py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="font-ethnocentric text-[10px] sm:text-xs tracking-[0.14em] sm:tracking-brand uppercase text-ink">
            {t.brandName}
          </div>
          <p className="text-xs sm:text-sm text-ink-faint leading-relaxed">
            © {new Date().getFullYear()} {t.brandName}. {t.footerRights}
          </p>
        </div>
      </div>
    </footer>
  );
}
