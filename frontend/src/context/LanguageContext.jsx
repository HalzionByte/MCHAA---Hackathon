"use client";

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from '../i18n/en';
import ur from '../i18n/ur';

const dictionaries = { en, ur };

const LanguageContext = createContext(undefined);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mchaa-lang');
      if (saved === 'en' || saved === 'ur') {
        setLangState(saved);
      }
    } catch {}
  }, []);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('mchaa-lang', newLang);
    } catch {}
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      const dict = dictionaries[lang] || dictionaries.en;
      let text = dict[key] || dictionaries.en[key] || key;
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
      return text;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'en',
      setLang: () => {},
      t: (key) => key,
    };
  }
  return ctx;
}
