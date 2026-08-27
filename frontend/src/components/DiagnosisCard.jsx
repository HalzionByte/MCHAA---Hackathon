"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfidenceRing from './UI/ConfidenceRing';
import { ChevronDown, Brain } from 'lucide-react';

export default function DiagnosisCard({ diagnosis }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
        <Brain className="w-4 h-4 text-[var(--cyan)]" />
        AI Diagnosis
      </h3>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <ConfidenceRing value={diagnosis.confidence} size={72} />
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Confidence</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{diagnosis.cause}</p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm text-[var(--cyan)] hover:text-[var(--emerald)] transition-colors mt-3"
          >
            {expanded ? 'Hide reasoning' : 'Show reasoning'}
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
            {diagnosis.reasoning}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
