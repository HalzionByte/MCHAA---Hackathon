"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sparkline from './UI/Sparkline';
import { getAllTelemetryHistory } from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { Droplets, CloudRain, Thermometer, Wind, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function EvidenceCard({ evidence, fieldId }) {
  const { t } = useLanguage();
  const [sparkData, setSparkData] = useState({});

  const metricConfigs = [
    { label: t('evidence.soilMoisture'), unit: '%', key: 'soil_moisture', color: 'var(--cyan)', Icon: Droplets },
    { label: t('evidence.rainfall'), unit: 'mm', key: 'rainfall', color: 'var(--emerald)', Icon: CloudRain },
    { label: t('evidence.temperature'), unit: '°C', key: 'temperature', color: 'var(--amber)', Icon: Thermometer },
    { label: t('evidence.humidity'), unit: '%', key: 'humidity', color: 'var(--cyan)', Icon: Wind },
  ];

  const ndviConfig = {
    label: t('evidence.ndviChange'),
    value: `${evidence.vegetation_ndvi_change > 0 ? '+' : ''}${evidence.vegetation_ndvi_change}`,
    unit: 'NDVI',
    key: 'ndvi',
    color: evidence.vegetation_ndvi_change >= 0 ? 'var(--emerald)' : 'var(--crimson)',
    Icon: evidence.vegetation_ndvi_change >= 0 ? TrendingUp : TrendingDown,
  };

  const metrics = [
    { ...metricConfigs[0], value: `${evidence.soil_moisture_percent}%` },
    { ...metricConfigs[1], value: `${evidence.rainfall_7d_mm} mm` },
    { ...metricConfigs[2], value: `${evidence.temperature_c}°C` },
    { ...metricConfigs[3], value: `${evidence.humidity_percent}%` },
    ndviConfig,
  ];

  useEffect(() => {
    if (!fieldId) return;
    let cancelled = false;
    const sparkKeys = ['soil_moisture', 'rainfall', 'temperature', 'humidity', 'ndvi'];
    async function load() {
      const history = await getAllTelemetryHistory(fieldId);
      if (!cancelled && history?.length) {
        const data = {};
        for (const key of sparkKeys) {
          data[key] = history.map(d => d[key]);
        }
        setSparkData(data);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fieldId]);

  return (
    <div className="glass-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
        <Activity className="w-4 h-4 text-[var(--cyan)]" />
        {t('evidence.title')}
        <span className="ms-auto inline-flex items-center gap-1.5 text-xs font-medium text-[var(--cyan)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse-cyan" />
          {t('evidence.live')}
        </span>
      </h3>
      <div className="space-y-4">
        {metrics.map((m, i) => {
          const Icon = m.Icon;
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ background: `${m.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
              {/* Label + Value */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">{m.label}</span>
                  <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: m.color }}>
                    {m.unit}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2 mt-0.5">
                  <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{m.value}</span>
                  <Sparkline data={sparkData[m.key] || []} color={m.color} height={28} width={64} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
