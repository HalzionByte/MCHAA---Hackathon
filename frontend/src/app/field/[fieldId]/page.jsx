"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Upload, Sprout, AlertTriangle } from 'lucide-react';
import AnalysisFlow from '../../../components/AnalysisFlow';
import EvidenceCard from '../../../components/EvidenceCard';
import DiagnosisCard from '../../../components/DiagnosisCard';
import RecommendationCard from '../../../components/RecommendationCard';
import HealthTimeline from '../../../components/HealthTimeline';
import { getField, getAnomaly } from '../../../api/api';

const FieldMap = dynamic(() => import('../../../components/FieldMap'), { ssr: false });

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
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

function NoAnomalyPlaceholder({ onOpenAnalysis }) {
  return (
    <div className="glass-card p-8 text-center space-y-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--emerald)]/10 mx-auto">
        <AlertTriangle className="w-7 h-7 text-[var(--emerald)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">No Active Anomalies</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
        This field is healthy. Upload an image to run a new analysis.
      </p>
      <button
        onClick={onOpenAnalysis}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--emerald)] text-[var(--bg-main)] text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Upload className="w-4 h-4" />
        Upload & Analyze
      </button>
    </div>
  );
}

export default function FieldPage() {
  const { fieldId } = useParams();
  const router = useRouter();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [field, setField] = useState(null);
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const fieldData = await getField(fieldId);
        setField(fieldData);
        if (fieldData?.anomalies?.length) {
          const anomalyData = await getAnomaly(fieldData.anomalies[0].anomaly_id);
          setAnomaly(anomalyData);
        }
      } catch (err) {
        console.error('Failed to load field data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fieldId]);

  const handleAnalyzeComplete = (anomalyId) => {
    setShowAnalysis(false);
    router.push(`/anomaly/${anomalyId}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--card-border)] bg-[var(--card-surface)] hover:bg-[var(--card-border)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {loading ? 'Loading...' : field?.name || 'Field Analysis'}
            </h1>
            {!loading && field && (
              <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <Sprout className="w-3.5 h-3.5" />
                {field.crop_type.charAt(0).toUpperCase() + field.crop_type.slice(1)} · {field.anomalies?.length === 1 ? '1 active anomaly' : `${field.anomalies?.length || 0} active anomalies`}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAnalysis(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--emerald)] text-[var(--bg-main)] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          Upload & Analyze
        </button>
      </div>

      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Map + Timeline (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          <FieldMap fieldId={fieldId} />
          <HealthTimeline fieldId={fieldId} />
        </div>

        {/* Right Column: Evidence + Diagnosis + Recommendation (2/5) */}
        <div className="lg:col-span-2">
          {loading ? (
            <SidebarSkeleton />
          ) : anomaly ? (
            <div className="space-y-6">
              <EvidenceCard evidence={anomaly.evidence} fieldId={fieldId} />
              <DiagnosisCard diagnosis={anomaly.diagnosis} />
              <RecommendationCard recommendation={anomaly.recommendation} createdAt={anomaly.created_at} />
            </div>
          ) : (
            <NoAnomalyPlaceholder onOpenAnalysis={() => setShowAnalysis(true)} />
          )}
        </div>
      </div>

      {/* Analysis Modal */}
      {showAnalysis && (
        <AnalysisFlow
          fieldId={fieldId}
          onComplete={handleAnalyzeComplete}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </div>
  );
}
