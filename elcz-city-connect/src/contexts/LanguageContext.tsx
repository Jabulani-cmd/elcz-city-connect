import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "sn" | "nd" | "st" | "ve";

export const languageNames: Record<Language, string> = {
  en: "English",
  sn: "Shona",
  nd: "Ndebele",
  st: "Sesotho",
  ve: "Tshivenda",
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback for cases where provider hasn't mounted yet
    return {
      language: (localStorage.getItem("site-language") as Language) || "en",
      setLanguage: (lang: Language) => localStorage.setItem("site-language", lang),
    } as LanguageContextType;
  }
  return ctx;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem("site-language") as Language) || "en"
  );

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("site-language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
