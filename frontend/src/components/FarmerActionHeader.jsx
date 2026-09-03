"use client";
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const colorMap = {
  RED: {
    border: 'var(--crimson)',
    bg: 'rgba(239,68,68,0.08)',
    text: 'var(--crimson)',
    icon: AlertTriangle,
  },
  YELLOW: {
    border: 'var(--amber)',
    bg: 'rgba(245,158,11,0.08)',
    text: 'var(--amber)',
    icon: Info,
  },
  GREEN: {
    border: 'var(--emerald)',
    bg: 'rgba(16,185,129,0.08)',
    text: 'var(--emerald)',
    icon: CheckCircle,
  },
};

export default function FarmerActionHeader({ farmerDecision }) {
  if (!farmerDecision) return null;
  const { t } = useLanguage();

  const { status_color, status_emoji, headline_what, headline_why, urgency_hours } = farmerDecision;
  const colors = colorMap[status_color] || colorMap.YELLOW;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 relative overflow-hidden border-s-4"
      style={{ borderInlineStartColor: colors.border, background: colors.bg }}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl flex-shrink-0 mt-0.5">{status_emoji}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
            {headline_what}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
            {headline_why}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ background: `${colors.border}18`, color: colors.text }}
        >
          <Clock className="w-3.5 h-3.5" />
          {urgency_hours}{t('farmer.hoursSuffix')}
        </div>
      </div>
    </motion.div>
  );
}
