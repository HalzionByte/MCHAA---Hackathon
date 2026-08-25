"use client";
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const priorityConfig = {
  1: { label: 'Urgent', icon: AlertTriangle, color: 'var(--crimson)', bg: 'rgba(239,68,68,0.15)', sla: 'Act within 24h' },
  2: { label: 'High', icon: Clock, color: 'var(--amber)', bg: 'rgba(245,158,11,0.15)', sla: 'Act within 48h' },
  3: { label: 'Medium', icon: CheckCircle, color: 'var(--emerald)', bg: 'rgba(16,185,129,0.15)', sla: 'Act within 1 week' },
};

export default function RecommendationCard({ recommendation }) {
  const config = priorityConfig[recommendation.priority] || priorityConfig[3];
  const Icon = config.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass elevation-2 p-5 relative overflow-hidden hover:elevation-3 transition-all duration-300"
      style={{ borderLeft: `4px solid ${config.color}` }}
    >
      <div className="absolute top-0 right-0 m-3">
        <span className="badge" style={{ background: config.bg, color: config.color }}>
          <Icon className="w-3 h-3 mr-1" /> {config.label}
        </span>
      </div>
      <h3 className="card-title">Recommended Action</h3>
      <p className="text-sm font-medium text-uppercase tracking-wide mb-2">{recommendation.action.replace(/_/g, ' ')}</p>
      <p className="text-muted mb-4">{recommendation.description}</p>
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--card-border)]">
        <span className="badge" style={{ background: config.bg, color: config.color }}>
          Zone: {recommendation.target_zone}
        </span>
        <span className="text-xs text-muted flex items-center gap-1">
          <Clock className="w-3 h-3" /> {config.sla}
        </span>
      </div>
    </motion.div>
  );
}