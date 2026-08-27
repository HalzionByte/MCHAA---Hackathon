"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getFarm } from '../api/api';
import Link from 'next/link';
import {
  Sprout, MapPin, AlertTriangle, TrendingUp,
  Upload, Clock, CheckCircle2, Leaf
} from 'lucide-react';
import Sparkline from './UI/Sparkline';

function generateTrendData(status) {
  const base = status === 'alert' ? 0.45 : 0.72;
  return Array.from({ length: 24 }, (_, i) =>
    base + Math.sin(i * 0.3) * 0.06 + (Math.random() - 0.5) * 0.02
  );
}

function FieldCard({ field }) {
  const ndvi = getNdviForStatus(field.status);
  const trendData = useMemo(() => generateTrendData(field.status), [field.status]);

  return (
    <Link
      href={`/field/${field.field_id}`}
      className="glass-card card-hover p-5 flex flex-col gap-4"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{field.name}</h3>
          <span className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--text-muted)]">
            <Sprout className="w-3 h-3" />
            {field.crop_type.charAt(0).toUpperCase() + field.crop_type.slice(1)}
          </span>
        </div>
        <span
          className={`badge ${field.status === 'alert' ? 'badge-alert' : 'badge-healthy'}`}
        >
          {field.status === 'alert'
            ? <><AlertTriangle className="w-3 h-3" /> Alert</>
            : <><CheckCircle2 className="w-3 h-3" /> Healthy</>
          }
        </span>
      </div>

      {/* NDVI + Sparkline Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">NDVI</span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              background: `${getNdviColor(ndvi)}18`,
              color: getNdviColor(ndvi),
            }}
          >
            {ndvi.toFixed(2)}
          </span>
        </div>
        <Sparkline data={trendData} color={getNdviColor(ndvi)} height={32} width={80} />
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)]">
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {field.anomaly_count} {field.anomaly_count === 1 ? 'issue' : 'issues'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(field.last_analyzed)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Never scanned';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNdviForStatus(status) {
  return status === 'alert' ? 0.45 : 0.72;
}

function getNdviColor(ndvi) {
  if (ndvi >= 0.6) return 'var(--emerald)';
  if (ndvi >= 0.4) return 'var(--amber)';
  return 'var(--crimson)';
}

export default function FarmOverview({ farmId }) {
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarm() {
      try {
        const data = await getFarm(farmId);
        setFarm(data);
      } catch (error) {
        console.error('Failed to load farm:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFarm();
  }, [farmId]);

  const activeAnomalies = useMemo(() => {
    if (!farm?.fields) return 0;
    return farm.fields.reduce((sum, f) => sum + (f.anomaly_count || 0), 0);
  }, [farm]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="glass-card p-8 text-center text-[var(--text-muted)]">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full mx-auto mb-3" />
          Loading farm data...
        </div>
      </div>
    );
  }
  if (!farm) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="glass-card p-8 text-center text-[var(--text-muted)]">Farm not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Header Bar */}
      <header className="glass-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Farm Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--cyan)]/10">
              <Leaf className="w-5 h-5 text-[var(--cyan)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{farm.name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <MapPin className="w-3.5 h-3.5" />
                {farm.location}
              </p>
            </div>
            <span className="ml-2 stat-chip text-[var(--cyan)] border-[var(--cyan)]/30">
              <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse-cyan" />
              System Active
            </span>
          </div>

          {/* Center: Quick Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="stat-chip">
              <Sprout className="w-4 h-4 text-[var(--emerald)]" />
              <span className="text-[var(--text-muted)]">Total Area</span>
              <span className="font-semibold text-[var(--text-primary)]">240 ha</span>
            </span>
            <span className="stat-chip">
              <TrendingUp className="w-4 h-4 text-[var(--emerald)]" />
              <span className="text-[var(--text-muted)]">Avg NDVI</span>
              <span className="font-semibold" style={{ color: getNdviColor(0.68) }}>0.68</span>
            </span>
            <span className="stat-chip" style={activeAnomalies > 0 ? { borderColor: 'var(--crimson)', background: 'rgba(239,68,68,0.08)' } : {}}>
              <AlertTriangle className="w-4 h-4" style={{ color: activeAnomalies > 0 ? 'var(--crimson)' : 'var(--emerald)' }} />
              <span className="text-[var(--text-muted)]">Anomalies</span>
              <span className="font-semibold" style={{ color: activeAnomalies > 0 ? 'var(--crimson)' : 'var(--emerald)' }}>
                {activeAnomalies}
              </span>
            </span>
          </div>

          {/* Right: CTA */}
          <Link
            href={`/field/${farm.fields?.[0]?.field_id || 'field-001'}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--emerald)] text-[var(--bg-main)] font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Upload & Analyze
          </Link>
        </div>
      </header>

      {/* Field Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {farm.fields.map((field) => (
            <FieldCard key={field.field_id} field={field} />
          ))}
        </div>
      </div>
    </div>
  );
}
