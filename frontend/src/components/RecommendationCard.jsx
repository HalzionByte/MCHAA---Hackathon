"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Droplets, Bug, Scissors, Lightbulb, Zap, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ServiceMarketplaceDrawer from './ServiceMarketplaceDrawer';
import WhatsAppWorkOrderModal from './WhatsAppWorkOrderModal';

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
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
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
      className="glass-card p-5 relative overflow-hidden space-y-3"
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

      {/* Action Triggers: Marketplace & WhatsApp Work Order */}
      <div className="pt-3 border-t border-[var(--card-border)] grid grid-cols-1 gap-2">
        <button
          onClick={() => setIsMarketplaceOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--cyan)]/20 via-[var(--cyan)]/10 to-[var(--emerald)]/20 border border-[var(--cyan)]/40 text-[var(--cyan)] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--cyan)]/25 transition-all"
        >
          <Zap className="w-4 h-4 fill-[var(--cyan)]" />
          Book Drone / Equipment Operator
        </button>

        <button
          onClick={() => setIsWhatsAppOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/25 transition-all"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          Send WhatsApp Audio Work Order
        </button>
      </div>

      <ServiceMarketplaceDrawer
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        fieldId={recommendation?.field_id || 'field-001'}
        anomalyId={recommendation?.anomaly_id}
      />

      <WhatsAppWorkOrderModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        fieldId={recommendation?.field_id || 'field-001'}
        anomalyId={recommendation?.anomaly_id}
        action={description || actionLabel}
        sector={recommendation?.target_zone || 'Zone B3'}
      />
    </motion.div>
  );
}
