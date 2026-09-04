"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfidenceRing from './UI/ConfidenceRing';
import { ChevronDown, Brain } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DiagnosisCard({ diagnosis, simplified }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const cause = diagnosis?.cause || '—';
  const reasoning = diagnosis?.reasoning || '';
  const confidence = diagnosis?.confidence ?? 0;

  // Simplified mode: plain problem + reasoning text, no toggle button
  if (simplified) {
    return (
      <div className="glass-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
          <Brain className="w-4 h-4 text-[var(--cyan)]" />
          {t('diagnosis.title')}
        </h3>
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <ConfidenceRing value={confidence} size={72} />
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{t('diagnosis.confidence')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{cause}</p>
            {reasoning && (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-3">{reasoning}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full mode: with Show/Hide reasoning toggle
  return (
    <div className="glass-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
        <Brain className="w-4 h-4 text-[var(--cyan)]" />
        {t('diagnosis.title')}
      </h3>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <ConfidenceRing value={confidence} size={72} />
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{t('diagnosis.confidence')}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{cause}</p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm text-[var(--cyan)] hover:text-[var(--emerald)] transition-colors mt-3"
          >
            {expanded ? t('diagnosis.hideReasoning') : t('diagnosis.showReasoning')}
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 text-sm text-[var(--text-muted)] bg-[var(--bg-main)]/60 p-4 rounded-lg border border-[var(--card-border)] leading-relaxed"
          >
            {reasoning}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
