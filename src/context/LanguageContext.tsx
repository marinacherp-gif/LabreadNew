"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { T, type Lang, type Translations } from "@/i18n/translations";

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: T.en,
  dir: "ltr",
});

export function LanguageProvider({ children, storageKey = "lang" }: { children: React.ReactNode; storageKey?: string }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Lang | null;
    if (stored === "en" || stored === "he") setLangState(stored);
  }, [storageKey]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(storageKey, l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: T[lang], dir: lang === "he" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
