"use client";

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllTelemetryHistory } from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, TrendingUp, Minus, AlertTriangle, Droplet, Thermometer, Wind } from 'lucide-react';

const metricOrder = ['ndvi', 'soil_moisture', 'temperature', 'rainfall', 'humidity'];

function getStatus(ndvi) {
  if (ndvi === null || ndvi === undefined) return 'unknown';
  if (ndvi >= 0.6) return 'healthy';
  if (ndvi >= 0.4) return 'moderate';
  return 'stressed';
}

function formatDate(dateStr, lang = 'en') {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label, formattedHistory, statusConfig }) {
  if (!active || !payload?.length) return null;
  const entry = formattedHistory?.find(d => d.formattedDate === label);
  const status = entry ? statusConfig[entry.status] || statusConfig.unknown : null;
  const StatusIcon = status?.icon;
  return (
    <div className="glass-card px-3 py-2 min-w-[160px]">
      <p className="text-xs text-[var(--text-muted)] mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--text-muted)]">{p.name}</span>
          </span>
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
      {status && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-[var(--card-border)]">
          {StatusIcon && <StatusIcon className="w-3 h-3" style={{ color: status.color }} />}
          <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
        </div>
      )}
    </div>
  );
}

export default function HealthTimeline({ fieldId }) {
  const { t, lang } = useLanguage();
  const [selectedMetrics, setSelectedMetrics] = useState(['ndvi', 'soil_moisture']);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  const metricConfig = {
    ndvi: { label: t('timeline.ndvi'), color: 'var(--emerald)', unit: '', icon: TrendingUp, yKey: 'ndvi' },
    soil_moisture: { label: t('timeline.soilMoisture'), color: 'var(--cyan)', unit: '%', icon: Droplet, yKey: 'soil_moisture' },
    temperature: { label: t('timeline.temperature'), color: 'var(--amber)', unit: '°C', icon: Thermometer, yKey: 'temperature' },
    rainfall: { label: t('timeline.rainfall'), color: 'var(--emerald)', unit: 'mm', icon: Droplet, yKey: 'rainfall' },
    humidity: { label: t('timeline.humidity'), color: 'var(--cyan)', unit: '%', icon: Wind, yKey: 'humidity' },
  };

  const statusConfig = {
    healthy: { label: t('timeline.healthy'), color: 'var(--emerald)', icon: TrendingUp, bg: 'rgba(16,185,129,0.15)' },
    moderate: { label: t('timeline.moderate'), color: 'var(--amber)', icon: Minus, bg: 'rgba(245,158,11,0.15)' },
    stressed: { label: t('timeline.stressed'), color: 'var(--crimson)', icon: AlertTriangle, bg: 'rgba(239,68,68,0.15)' },
    unknown: { label: t('timeline.noDataLabel'), color: 'var(--text-muted)', icon: Minus, bg: 'transparent' },
  };

  const formattedHistory = history?.map(d => ({
    ...d,
    formattedDate: formatDate(d.date, lang),
  }));

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getAllTelemetryHistory(fieldId);
        if (!data?.length) {
          setHistory([]);
          return;
        }

        const combined = data.map((day) => {
          const record = { ...day };
          record.status = getStatus(day.ndvi);
          return record;
        });

        setHistory(combined);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [fieldId]);

  if (loading) {
    return (
      <div className="glass p-8 text-center text-muted">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p>{t('timeline.loading')}</p>
      </div>
    );
  }

  if (!history?.length) {
    return <div className="glass p-8 text-center text-muted">{t('timeline.noData')}</div>;
  }

  return (
    <div className="glass p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="card-title flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t('timeline.title')}
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {metricOrder.map(m => {
            const config = metricConfig[m];
            const isActive = selectedMetrics.includes(m);
            const Icon = config.icon;
            return (
              <button
                key={m}
                onClick={() => setSelectedMetrics(isActive
                  ? selectedMetrics.filter(x => x !== m)
                  : [...selectedMetrics, m]
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                style={isActive ? {
                  background: config.color + '18',
                  color: config.color,
                  borderColor: config.color + '40',
                } : {
                  background: 'rgba(30, 41, 59, 0.6)',
                  color: 'var(--text-muted)',
                  borderColor: 'rgba(51, 65, 85, 0.5)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <AnimatePresence>
        {selectedMetrics.map((metricKey) => {
          const config = metricConfig[metricKey];
          const data = formattedHistory.map(d => ({
            date: d.formattedDate,
            value: d[metricKey],
            fullDate: d.date
          })).filter(d => d.value !== null);

          if (!data.length) return null;

          return (
            <motion.div
              key={metricKey}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <config.icon className="w-5 h-5" style={{ color: config.color }} />
                  <span className="font-medium">{config.label} {config.unit && `(${config.unit})`}</span>
                </div>
                <span className="text-xs text-muted">
                  {t('timeline.range', { min: Math.min(...data.map(d => d.value)).toFixed(2), max: Math.max(...data.map(d => d.value)).toFixed(2), unit: config.unit })}
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={config.color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={config.color} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                      interval={6}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--card-border)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => v.toFixed(metricKey === 'ndvi' ? 2 : 0)}
                    />
                    <Tooltip
                      content={<CustomTooltip formattedHistory={formattedHistory} statusConfig={statusConfig} />}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name={config.label}
                      stroke={config.color}
                      strokeWidth={2}
                      fillOpacity={0.6}
                      fill={`url(#gradient-${metricKey})`}
                      connectNulls
                    />
                    <ReferenceLine y={data.reduce((sum, d) => sum + d.value, 0) / data.length} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ position: 'right', fill: 'var(--text-muted)', formatter: v => t('timeline.avg', { value: v.toFixed(2) }) }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {selectedMetrics.length === 0 && (
        <div className="text-center py-12 text-muted">
          {t('timeline.selectMetrics')}
        </div>
      )}
    </div>
  );
}
