"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfidenceRing from './UI/ConfidenceRing';
import { ChevronDown } from 'lucide-react';

export default function DiagnosisCard({ diagnosis }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass elevation-2 p-5 hover:elevation-3 transition-shadow duration-300">
      <h3 className="card-title">Diagnosis</h3>
      <div className="flex items-start gap-6">
        <ConfidenceRing value={diagnosis.confidence} size={72} />
        <div className="flex-1 min-w-0">
          <p className="text-muted mb-4">{diagnosis.cause}</p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-cyan hover:text-emerald transition-colors mb-4"
          >
            {expanded ? 'Hide reasoning' : 'Show reasoning'} <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-muted bg-[var(--card-surface)] p-3 rounded-lg border border-[var(--card-border)]"
              >
                {diagnosis.reasoning}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}