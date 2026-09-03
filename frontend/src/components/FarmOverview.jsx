"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getFarm } from '../api/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, AlertTriangle, Upload, Clock, CheckCircle2, Leaf, Sprout } from 'lucide-react';
import AnalysisFlow from './AnalysisFlow';
import AudioAlertPlayer from './AudioAlertPlayer';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

const cropEmojis = {
  wheat: '🌾',
  rice: '🍚',
  cotton: '🌿',
  sugarcane: '🎋',
};

const cropNameKeys = {
  wheat: 'crop.wheat',
  rice: 'crop.rice',
  cotton: 'crop.cotton',
  sugarcane: 'crop.sugarcane',
};

function FieldCard({ field }) {
  const { t } = useLanguage();
  const isAlert = field.status === 'alert';
  const emoji = cropEmojis[field.crop_type] || '🌱';
  const cropNameKey = cropNameKeys[field.crop_type];

  function formatRelativeTime(dateStr) {
    if (!dateStr) return t('status.neverScanned');
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t('status.justNow');
    if (hours < 24) return t('status.hoursAgo', { hours });
    const days = Math.floor(hours / 24);
    return t('status.daysAgo', { days });
  }

  return (
    <Link
      href={`/field/${field.field_id}`}
      className="glass-card card-hover p-6 flex flex-col gap-5 min-h-[220px]"
    >
      {/* Traffic Light + Field Name Row */}
      <div className="flex items-center gap-5">
        {/* Giant Traffic Light */}
        <div className="flex-shrink-0 relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: isAlert ? 'var(--crimson)' : 'var(--emerald)',
              boxShadow: isAlert
                ? '0 0 20px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.2)'
                : '0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.2)',
              animation: isAlert ? 'traffic-light-pulse 2s ease-in-out infinite' : 'none',
            }}
          >
            {isAlert ? (
              <AlertTriangle className="w-9 h-9 text-white" />
            ) : (
              <CheckCircle2 className="w-9 h-9 text-white" />
            )}
          </div>
        </div>

        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-[var(--text-primary)] truncate">
            {field.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">{emoji}</span>
            <span className="text-lg text-[var(--text-muted)]">
              {cropNameKey ? t(cropNameKey) : field.crop_type}
            </span>
          </div>
        </div>
      </div>

      {/* Status + Scan Info Row */}
      <div className="flex items-center gap-4 pt-3 border-t border-[var(--card-border)]">
        <span
          className="flex items-center gap-2 text-base font-bold"
          style={{ color: isAlert ? 'var(--crimson)' : 'var(--emerald)' }}
        >
          {isAlert ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              {field.anomaly_count} {field.anomaly_count === 1 ? t('status.issue') : t('status.issues')}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {t('status.healthy')}
            </>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
          <Clock className="w-4 h-4" />
          {formatRelativeTime(field.last_analyzed)}
        </span>
      </div>
    </Link>
  );
}

export default function FarmOverview({ farmId }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

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

  const hasActiveAlert = useMemo(() => {
    if (!farm?.fields) return false;
    return farm.fields.some(f => f.status === 'alert');
  }, [farm]);

  const activeAnomalyId = useMemo(() => {
    if (!farm?.fields) return null;
    for (const f of farm.fields) {
      if (f.status === 'alert' && f.anomalies?.length) {
        return f.anomalies[0].anomaly_id;
      }
    }
    return null;
  }, [farm]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="glass-card p-8 text-center text-[var(--text-muted)]">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full mx-auto mb-3" />
          {t('farm.loading')}
        </div>
      </div>
    );
  }
  if (!farm) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="glass-card p-8 text-center text-[var(--text-muted)]">{t('farm.notFound')}</div>
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
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--cyan)]/10">
              <Leaf className="w-6 h-6 text-[var(--cyan)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{farm.name}</h1>
              <p className="flex items-center gap-1.5 text-base text-[var(--text-muted)]">
                <MapPin className="w-4 h-4" />
                {farm.location}
              </p>
            </div>
          </div>

          {/* Right: System Status + Language Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="stat-chip text-[var(--cyan)] border-[var(--cyan)]/30">
              <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse-cyan" />
              {t('farm.systemActive')}
            </span>
            <Link
              href="/crops"
              className="stat-chip text-[var(--emerald)] border-[var(--emerald)]/30 hover:bg-[var(--emerald)]/10 transition-colors"
            >
              <Sprout className="w-4 h-4" />
              {t('farm.cropGuide')}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Field Cards Grid */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">{t('farm.yourFields')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farm.fields.map((field) => (
            <FieldCard key={field.field_id} field={field} />
          ))}
        </div>
      </div>

      {/* Giant Upload Button */}
      <button
        onClick={() => setShowAnalysis(true)}
        className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[var(--emerald)] text-[var(--bg-main)] font-bold text-xl hover:opacity-90 transition-opacity"
        style={{ minHeight: 80 }}
      >
        <Upload className="w-7 h-7" />
        {t('farm.uploadImage')}
      </button>

      {/* Analysis Modal */}
      {showAnalysis && (
        <AnalysisFlow
          fieldId={farm.fields?.[0]?.field_id || 'field-001'}
          onComplete={(anomalyId) => {
            setShowAnalysis(false);
            router.push(`/anomaly/${anomalyId}`);
          }}
          onClose={() => setShowAnalysis(false)}
        />
      )}

      {/* Audio Player — only if there's an active alert */}
      {hasActiveAlert && <AudioAlertPlayer anomalyId={activeAnomalyId} />}
    </div>
  );
}
