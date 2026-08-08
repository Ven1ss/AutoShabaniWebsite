"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  type Locale,
  translations,
  defaultLocale,
  getStoredLocale,
  setStoredLocale,
} from "@/lib/translations";

type Translations = (typeof translations)[Locale];

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? defaultLocale
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== locale) setLocaleState(stored);
    setMounted(true);
    // Sync cookie if missing
    setStoredLocale(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setStoredLocale(next);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: translations[locale],
    }),
    [locale, setLocale]
  );

  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{
          ...value,
          locale: initialLocale ?? defaultLocale,
          t: translations[initialLocale ?? defaultLocale],
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
