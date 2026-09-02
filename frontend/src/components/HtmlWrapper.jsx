"use client";

import { useLanguage } from '../context/LanguageContext';

export default function HtmlWrapper({ children }) {
  const { lang } = useLanguage();
  return (
    <html lang={lang} dir={lang === 'ur' ? 'rtl' : 'ltr'} className={`${lang === 'ur' ? 'font-noto' : 'font-inter'} antialiased`}>
      <head>
        <meta name="theme-color" content="#0B0F17" />
      </head>
      <body className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-[var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
