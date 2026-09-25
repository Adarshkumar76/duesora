"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES, getTranslation } from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (path: string) => path,
});

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Check cookie or localStorage on initial mount
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("duesora_locale=") || row.startsWith("NEXT_LOCALE="))
      ?.split("=")[1] as Locale | undefined;

    if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    } else {
      const local = localStorage.getItem("duesora_locale") as Locale | undefined;
      if (local && SUPPORTED_LOCALES.some((l) => l.code === local)) {
        setLocaleState(local);
        document.documentElement.lang = local;
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    startTransition(() => {
      setLocaleState(newLocale);
      document.documentElement.lang = newLocale;
      // Persist to cookie (1 year expiry) and localStorage
      document.cookie = `duesora_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      try {
        localStorage.setItem("duesora_locale", newLocale);
      } catch {
        // Ignore localStorage errors in private mode
      }
    });
  };

  const t = (path: string, params?: Record<string, string | number>) => {
    return getTranslation(locale, path, params);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  return ctx;
}
