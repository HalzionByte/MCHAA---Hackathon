"use client";
import { motion } from 'framer-motion';
import Sparkline from './UI/Sparkline';
import { getTelemetryHistory } from '../api/api';

export default function EvidenceCard({ evidence, fieldId }) {
  const metrics = [
    { label: 'Soil Moisture', value: `${evidence.soil_moisture_percent}%`, unit: '%', key: 'soil_moisture', color: 'var(--cyan)' },
    { label: 'Rainfall (7d)', value: `${evidence.rainfall_7d_mm} mm`, unit: 'mm', key: 'rainfall', color: 'var(--emerald)' },
    { label: 'Temperature', value: `${evidence.temperature_c}°C`, unit: '°C', key: 'temperature', color: 'var(--amber)' },
    { label: 'Humidity', value: `${evidence.humidity_percent}%`, unit: '%', key: 'humidity', color: 'var(--cyan)' },
    { label: 'NDVI Change', value: `${evidence.vegetation_ndvi_change > 0 ? '+' : ''}${evidence.vegetation_ndvi_change}`, unit: 'NDVI', key: 'ndvi', color: 'var(--emerald)' },
  ];

  return (
    <div className="glass elevation-2 p-5 hover:elevation-3 transition-shadow duration-300">
      <h3 className="card-title flex items-center gap-2">
        Environmental Evidence
        <span className="text-xs badge bg-cyan\/10 text-cyan animate-pulse-cyan">LIVE</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">{m.label}</span>
              <span className="text-cyan text-xs font-medium uppercase tracking-wide">{m.unit}</span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-bold tabular-nums">{m.value}</span>
              <Sparkline data={getTelemetryHistory(fieldId, m.key)} color={m.color} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}