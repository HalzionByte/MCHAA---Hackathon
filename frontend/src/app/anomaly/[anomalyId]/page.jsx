"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sprout } from 'lucide-react';
import { getAnomaly } from '../../../api/api';
import FarmerActionHeader from '../../../components/FarmerActionHeader';
import ImpactMetricsCard from '../../../components/ImpactMetricsCard';
import CommunicationPanel from '../../../components/CommunicationPanel';
import EvidenceCard from '../../../components/EvidenceCard';
import DiagnosisCard from '../../../components/DiagnosisCard';
import RecommendationCard from '../../../components/RecommendationCard';
import HealthTimeline from '../../../components/HealthTimeline';
import AudioAlertPlayer from '../../../components/AudioAlertPlayer';
import { getSeverityColor, getSeverityLabel, getSeverityBg } from '../../../lib/severity';

function AnomalyPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-5 animate-pulse">
        <div className="h-4 bg-[var(--card-border)] rounded w-1/3 mb-4" />
        <div className="h-3 bg-[var(--card-border)] rounded w-2/3" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-5 animate-pulse">
          <div className="h-4 bg-[var(--card-border)] rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-3 bg-[var(--card-border)] rounded w-full" />
            <div className="h-3 bg-[var(--card-border)] rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnomalyPage() {
  const { anomalyId } = useParams();
  const router = useRouter();
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAnomaly(anomalyId);
        setAnomaly(data);
      } catch (err) {
        console.error('Failed to load anomaly:', err);
        setError('Failed to load anomaly data.');
      } finally {
        setLoading(false);
      }
    }
    if (anomalyId) load();
  }, [anomalyId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <div className="h-4 bg-[var(--card-border)] rounded w-24 animate-pulse" />
        </div>
        <AnomalyPageSkeleton />
      </div>
    );
  }

  if (error || !anomaly) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="glass-card p-8 text-center text-[var(--text-muted)]">
          {error || 'Anomaly not found'}
        </div>
      </div>
    );
  }

  const severity = anomaly.severity;
  const severityColor = getSeverityColor(severity);
  const severityLabel = getSeverityLabel(severity);
  const severityBg = getSeverityBg(severity);

  return (
    <div className="max-w-7xl mx-auto p-6" style={{ paddingBottom: 120 }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--card-border)] bg-[var(--card-surface)] hover:bg-[var(--card-border)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Anomaly Analysis
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              <Sprout className="w-3.5 h-3.5" />
              {anomaly.anomaly_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <span className="text-[var(--card-border)]">·</span>
              Zone {anomaly.detected_region?.zone || 'Unknown'}
              <span className="text-[var(--card-border)]">·</span>
              #{anomaly.anomaly_id?.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>

      {/* Farmer Action Header (full width) */}
      {anomaly.farmer_decision && (
        <div className="mb-6">
          <FarmerActionHeader farmerDecision={anomaly.farmer_decision} />
        </div>
      )}

      {/* Severity Bar (full width) */}
      <div className="glass-card p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="badge badge-alert">Active</span>
            <span className="badge" style={{ background: severityBg, color: severityColor }}>
              {severityLabel} ({(severity * 100).toFixed(0)}%)
            </span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            AI Confidence: {(anomaly.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${severity * 100}%`, backgroundColor: severityColor }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Severity progression: {(severity * 100).toFixed(0)}%
        </p>
      </div>

      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Evidence + Diagnosis + Recommendation (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          <EvidenceCard evidence={anomaly.evidence} fieldId={anomaly.field_id} />
          <DiagnosisCard diagnosis={anomaly.diagnosis} />
          <RecommendationCard recommendation={anomaly.recommendation} createdAt={anomaly.created_at} />
        </div>

        {/* Right Column: Impact + Communication (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          <ImpactMetricsCard impactMetrics={anomaly.impact_metrics} />
          <CommunicationPanel
            voiceAudioUrl={anomaly.voice_audio_url}
            smsText={anomaly.sms_text}
          />
        </div>
      </div>

      {/* Health Timeline (full width) */}
      <div className="mt-6">
        <HealthTimeline fieldId={anomaly.field_id} />
      </div>

      {/* Audio Alert Player */}
      <AudioAlertPlayer anomalyId={anomaly.anomaly_id} />
    </div>
  );
}
