"use client";

import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSync() {
  const { lang } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.body.classList.toggle('font-urdu', lang === 'ur');
  }, [lang]);

  return null;
}
