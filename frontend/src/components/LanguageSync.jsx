"use client";

import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSync() {
  const { lang } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ur' ? 'rtl' : 'ltr';
    html.className = `${lang === 'ur' ? 'font-noto' : 'font-inter'} antialiased`;
  }, [lang]);

  return null;
}
