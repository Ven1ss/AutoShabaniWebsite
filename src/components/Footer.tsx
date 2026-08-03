"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="surface-white border-t border-black/[0.06] py-10 sm:py-12 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="container-as flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="font-ethnocentric text-[10px] sm:text-xs tracking-brand uppercase text-as-dark">
          {t.brandName}
        </p>
        <p className="text-caption text-as-gray">
          © {new Date().getFullYear()} {t.brandName}. {t.footerRights}
        </p>
      </div>
    </footer>
  );
}
