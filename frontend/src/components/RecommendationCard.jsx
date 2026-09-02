"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle, Droplets, Bug, Scissors, Lightbulb } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const priorityConfig = {
  1: { label: 'Urgent', icon: AlertTriangle, color: 'var(--crimson)', bg: 'rgba(239,68,68,0.15)', slaHours: 24 },
  2: { label: 'High', icon: Clock, color: 'var(--amber)', bg: 'rgba(245,158,11,0.15)', slaHours: 48 },
  3: { label: 'Medium', icon: CheckCircle, color: 'var(--emerald)', bg: 'rgba(16,185,129,0.15)', slaHours: 168 },
};

const actionIcons = {
  prioritize_irrigation: Droplets,
  apply_pesticide: Bug,
  harvest_early: Scissors,
};

export default function RecommendationCard({ recommendation, createdAt }) {
  const { t } = useLanguage();
  const config = priorityConfig[recommendation.priority] || priorityConfig[3];
  const PriorityIcon = config.icon;
  const ActionIcon = actionIcons[recommendation.action] || Lightbulb;

  function formatCountdown(hoursRemaining) {
    if (hoursRemaining <= 0) return t('recommendation.overdue');
    if (hoursRemaining < 24) return t('recommendation.hoursRemaining', { hours: Math.floor(hoursRemaining) });
    const days = Math.floor(hoursRemaining / 24);
    return t('recommendation.daysRemaining', { days });
  }

  const [timeLeft, setTimeLeft] = useState(() => {
    if (!createdAt) return config.slaHours;
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    return Math.max(0, config.slaHours - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!createdAt) return;
      const elapsed = (Date.now() - new Date(createdAt).getTime()) / 3600000;
      setTimeLeft(Math.max(0, config.slaHours - elapsed));
    }, 60000);
    return () => clearInterval(interval);
  }, [createdAt, config.slaHours]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-5 relative overflow-hidden"
    >
      {/* Priority Badge (top-right) */}
      <div className="absolute top-3 right-3">
        <span className="badge" style={{ background: config.bg, color: config.color }}>
          <PriorityIcon className="w-3 h-3 mr-1" />
          {config.label}
        </span>
      </div>

      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
        <Lightbulb className="w-4 h-4 text-[var(--cyan)]" />
        {t('recommendation.title')}
      </h3>

      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg mt-0.5"
          style={{ background: `${config.color}15` }}
        >
          <ActionIcon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">
            {recommendation.action.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
            {recommendation.description}
          </p>
        </div>
      </div>

      {/* Footer: Zone + SLA Countdown */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)]">
        <span className="badge" style={{ background: config.bg, color: config.color }}>
          {t('recommendation.zone', { zone: recommendation.target_zone })}
        </span>
        <span
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: timeLeft <= 4 ? 'var(--crimson)' : config.color }}
        >
          <Clock className="w-3 h-3" />
          {formatCountdown(timeLeft)}
        </span>
      </div>
    </motion.div>
  );
}
