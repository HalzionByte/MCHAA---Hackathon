"use client";

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllTelemetryHistory } from '../api/api';
import { Calendar, TrendingUp, Minus, AlertTriangle, Droplet, Thermometer, Wind } from 'lucide-react';

const metricConfig = {
  ndvi: { label: 'NDVI', color: 'var(--emerald)', unit: '', icon: TrendingUp, yKey: 'ndvi' },
  soil_moisture: { label: 'Soil Moisture', color: 'var(--cyan)', unit: '%', icon: Droplet, yKey: 'soil_moisture' },
  temperature: { label: 'Temperature', color: 'var(--amber)', unit: '°C', icon: Thermometer, yKey: 'temperature' },
  rainfall: { label: 'Rainfall', color: 'var(--emerald)', unit: 'mm', icon: Droplet, yKey: 'rainfall' },
  humidity: { label: 'Humidity', color: 'var(--cyan)', unit: '%', icon: Wind, yKey: 'humidity' },
};

const metricOrder = ['ndvi', 'soil_moisture', 'temperature', 'rainfall', 'humidity'];

const statusConfig = {
  healthy: { label: 'Healthy', color: 'var(--emerald)', icon: TrendingUp, bg: 'rgba(16,185,129,0.15)' },
  moderate: { label: 'Moderate', color: 'var(--amber)', icon: Minus, bg: 'rgba(245,158,11,0.15)' },
  stressed: { label: 'Stressed', color: 'var(--crimson)', icon: AlertTriangle, bg: 'rgba(239,68,68,0.15)' },
  unknown: { label: 'No Data', color: 'var(--text-muted)', icon: Minus, bg: 'transparent' },
};

function getStatus(ndvi) {
  if (ndvi === null || ndvi === undefined) return 'unknown';
  if (ndvi >= 0.6) return 'healthy';
  if (ndvi >= 0.4) return 'moderate';
  return 'stressed';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HealthTimeline({ fieldId }) {
  const [selectedMetrics, setSelectedMetrics] = useState(['ndvi', 'soil_moisture']);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <p>Loading health history...</p>
      </div>
    );
  }

  if (!history?.length) {
    return <div className="glass p-8 text-center text-muted">No historical data available</div>;
  }

  return (
    <div className="glass p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="card-title flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Health Timeline (Last 45 Days)
        </h3>
        <div className="flex items-center gap-2">
          {metricOrder.map(m => (
            <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(m)}
                onChange={(e) => setSelectedMetrics(e.target.checked
                  ? [...selectedMetrics, m]
                  : selectedMetrics.filter(x => x !== m)
                )}
                className="rounded border-[var(--card-border)] bg-[var(--card-surface)] text-emerald-500 focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1" style={{ color: metricConfig[m].color }}>
                {(() => { const Icon = metricConfig[m].icon; return <Icon className="w-3.5 h-3.5" />; })()}
                {metricConfig[m].label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="overflow-x-auto pb-2 -mx-5 px-5">
        <div className="flex gap-1 min-w-max" role="list" aria-label="Daily crop health status">
          {history.map((day, i) => {
            const status = statusConfig[day.status] || statusConfig.unknown;
            return (
              <motion.div
                key={day.date}
                layoutId={day.date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer group relative"
                style={{ background: status.bg, border: `1px solid ${status.color}40` }}
                role="listitem"
                aria-label={`${formatDate(day.date)}: ${status.label}`}
              >
                {(() => { const Icon = status.icon; return <Icon className="w-4 h-4" style={{ color: status.color }} />; })()}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: status.color, color: 'var(--bg-main)' }}>
                  {formatDate(day.date)} - {status.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <AnimatePresence mode="wait">
        {selectedMetrics.map((metricKey) => {
          const config = metricConfig[metricKey];
          const data = history.map(d => ({
            date: formatDate(d.date),
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
                  Range: {Math.min(...data.map(d => d.value)).toFixed(2)} – {Math.max(...data.map(d => d.value)).toFixed(2)} {config.unit}
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
                      contentStyle={{
                        background: 'var(--card-surface)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                      formatter={(value /*, name */) => [value.toFixed(metricKey === 'ndvi' ? 2 : 1), config.label]}
                      labelFormatter={v => formatDate(data.find(d => d.date === v)?.fullDate || v)}
                    />
                    <Legend />
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
                    <ReferenceLine y={data.reduce((sum, d) => sum + d.value, 0) / data.length} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ position: 'right', fill: 'var(--text-muted)', formatter: v => `Avg: ${v.toFixed(2)}` }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {selectedMetrics.length === 0 && (
        <div className="text-center py-12 text-muted">
          Select at least one metric to display charts
        </div>
      )}
    </div>
  );
}