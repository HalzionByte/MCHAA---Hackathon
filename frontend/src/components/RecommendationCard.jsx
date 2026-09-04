"use client";
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Droplets, Bug, Scissors, Lightbulb } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const actionIcons = {
  prioritize_irrigation: Droplets,
  apply_pesticide: Bug,
  harvest_early: Scissors,
};

const actionTranslationKeys = {
  prioritize_irrigation: 'recommendation.prioritizeIrrigation',
  apply_pesticide: 'recommendation.applyPesticide',
  harvest_early: 'recommendation.harvestEarly',
};

export default function RecommendationCard({ recommendation, createdAt, simplified }) {
  const { t, lang } = useLanguage();
  const action = recommendation?.action || '';
  const description = recommendation?.description || '';

  const priorityConfig = {
    1: { label: t('recommendation.urgent'), icon: AlertTriangle, color: 'var(--crimson)', bg: 'rgba(239,68,68,0.15)' },
    2: { label: t('recommendation.high'), icon: AlertTriangle, color: 'var(--amber)', bg: 'rgba(245,158,11,0.15)' },
    3: { label: t('recommendation.medium'), icon: CheckCircle, color: 'var(--emerald)', bg: 'rgba(16,185,129,0.15)' },
  };

  const config = priorityConfig[recommendation?.priority] || priorityConfig[3];

  const actionLabel = actionTranslationKeys[action]
    ? t(actionTranslationKeys[action])
    : action.replace(/_/g, ' ');

  // Simplified mode: no priority badge, no zone — just action text
  if (simplified) {
    return (
      <div className="glass-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
          <Lightbulb className="w-4 h-4 text-[var(--cyan)]" />
          {t('recommendation.title')}
        </h3>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {description || actionLabel || '—'}
          </p>
        </div>
      </div>
    );
  }

  // Full mode: priority badge + zone
  const PriorityIcon = config.icon;
  const ActionIcon = actionIcons[action] || Lightbulb;

  return (
    <motion.div
      initial={{ opacity: 0, x: lang === 'ur' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-5 relative overflow-hidden"
    >
      {/* Priority Badge (top-right) */}
      <div className="absolute top-3 end-3">
        <span className="badge" style={{ background: config.bg, color: config.color }}>
          <PriorityIcon className="w-3 h-3 mr-1" />
          {config.label}
        </span>
      </div>

      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
        <Lightbulb className="w-4 h-4 text-[var(--cyan)]" />
        {t('recommendation.title')}
      </h3>

        <div className="flex flex-col items-center justify-center gap-2 text-center mb-3 py-2">
          <ActionIcon className="w-6 h-6 text-[var(--cyan)]" />
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {description || actionLabel || '—'}
          </p>
        </div>
    </motion.div>
  );
}
