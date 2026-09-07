"use client";

import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-full border border-[var(--card-border)] bg-[var(--card-surface)] overflow-hidden">
      <button
        onClick={() => setLang('en')}
        className="px-3 py-1.5 text-sm font-semibold transition-all"
        style={{
          background: lang === 'en' ? 'var(--cyan)' : 'transparent',
          color: lang === 'en' ? 'var(--bg-main)' : 'var(--text-muted)',
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLang('ur')}
        className="px-3 py-1.5 text-sm font-semibold transition-all"
        style={{
          background: lang === 'ur' ? 'var(--cyan)' : 'transparent',
          color: lang === 'ur' ? 'var(--bg-main)' : 'var(--text-muted)',
        }}
      >
        اردو
      </button>
    </div>
  );
}
