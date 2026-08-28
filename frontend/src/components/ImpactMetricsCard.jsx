"use client";
import { motion } from 'framer-motion';
import { TrendingUp, Droplets, DollarSign } from 'lucide-react';

const metrics = [
  {
    key: 'crop_loss_saved_usd',
    label: 'Crop Loss Saved',
    format: (v) => `$${v.toLocaleString()}`,
    color: 'var(--emerald)',
    Icon: TrendingUp,
  },
  {
    key: 'water_saved_liters',
    label: 'Water Saved',
    format: (v) => `${v.toLocaleString()}L`,
    color: 'var(--cyan)',
    Icon: Droplets,
  },
  {
    key: 'cost_saved_usd',
    label: 'Cost Saved',
    format: (v) => `$${v.toLocaleString()}`,
    color: 'var(--emerald)',
    Icon: DollarSign,
  },
];

export default function ImpactMetricsCard({ impactMetrics }) {
  if (!impactMetrics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-5"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
        <TrendingUp className="w-4 h-4 text-[var(--emerald)]" />
        Impact Summary
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.Icon;
          const value = impactMetrics[m.key];
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-3 rounded-lg"
              style={{ background: `${m.color}08` }}
            >
              <div className="flex items-center justify-center mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `${m.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
              </div>
              <div className="text-xl font-bold tabular-nums" style={{ color: m.color }}>
                {m.format(value)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-tight">
                {m.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
