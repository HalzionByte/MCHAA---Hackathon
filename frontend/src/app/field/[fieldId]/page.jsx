"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Upload, AlertTriangle, MapPin, RotateCcw } from 'lucide-react';
import AnalysisFlow from '../../../components/AnalysisFlow';
import EvidenceCard from '../../../components/EvidenceCard';
import DiagnosisCard from '../../../components/DiagnosisCard';
import RecommendationCard from '../../../components/RecommendationCard';
import HealthTimeline from '../../../components/HealthTimeline';
import CropSelectorModal from '../../../components/CropSelectorModal';
import AudioAlertPlayer from '../../../components/AudioAlertPlayer';
import { getField, getAnomaly } from '../../../api/api';
import { useLanguage } from '../../../context/LanguageContext';

const FieldMap = dynamic(() => import('../../../components/FieldMap'), { ssr: false });

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
  const { t } = useLanguage();
  return (
    <div className="glass-card p-8 text-center space-y-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--emerald)]/10 mx-auto">
        <AlertTriangle className="w-7 h-7 text-[var(--emerald)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('field.noAnomalies')}</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
        {t('field.noAnomaliesDesc')}
      </p>
      <button
        onClick={onOpenAnalysis}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--emerald)] text-[var(--bg-main)] text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Upload className="w-4 h-4" />
        {t('field.uploadAnalyze')}
      </button>
    </div>
  );
}

export default function FieldPage() {
  const { fieldId } = useParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCropSelector, setShowCropSelector] = useState(false);
  const [field, setField] = useState(null);
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drawn-area overlay state (ephemeral)
  const [drawnFieldId, setDrawnFieldId] = useState(null);
  const [drawnEvidence, setDrawnEvidence] = useState(null);
  const [drawnFieldName, setDrawnFieldName] = useState(null);

  // Voice play state (browser speechSynthesis)
  const [voicePlaying, setVoicePlaying] = useState(false);

  const fieldVoiceText = React.useMemo(() => {
    if (!field || !anomaly) return '';
    const problem = anomaly.diagnosis?.cause || 'Unknown problem detected';
    const action = anomaly.recommendation?.description || anomaly.recommendation?.action?.replace(/_/g, ' ') || '';
    const parts = [`Alert in ${field.name}. Problem: ${problem}.`];
    if (action) parts.push(`Recommended action: ${action}.`);
    return parts.join(' ');
  }, [field, anomaly]);

  // Race guard: track the latest load so stale responses can't overwrite current state
  const loadIdRef = useRef(0);

  useEffect(() => {
    // Reset state immediately so stale previous-field data never flashes
    setField(null);
    setAnomaly(null);
    setLoading(true);
    setDrawnFieldId(null);
    setDrawnEvidence(null);
    setDrawnFieldName(null);

    const id = ++loadIdRef.current;

    async function load() {
      try {
        const fieldData = await getField(fieldId);
        // Ignore if a newer load has started (stale fieldId)
        if (id !== loadIdRef.current) return;
        setField(fieldData);
        if (fieldData?.anomalies?.length) {
          const anomalyData = await getAnomaly(fieldData.anomalies[0].anomaly_id);
          if (id === loadIdRef.current) setAnomaly(anomalyData);
        }
      } catch (err) {
        console.error('Failed to load field data:', err);
      } finally {
        if (id === loadIdRef.current) setLoading(false);
      }
    }
    load();
  }, [fieldId]);

  const handleAnalyzeComplete = (anomalyId) => {
    setShowAnalysis(false);
    router.push(`/anomaly/${anomalyId}`);
  };

  const handleCropChanged = async () => {
    try {
      const fieldData = await getField(fieldId);
      setField(fieldData);
      if (fieldData?.anomalies?.length) {
        const anomalyData = await getAnomaly(fieldData.anomalies[0].anomaly_id);
        setAnomaly(anomalyData);
      }
    } catch (err) {
      console.error('Failed to reload field data:', err);
    }
  };

  const handleAreaAnalyzed = useCallback((analysis) => {
    setDrawnFieldId(analysis.field_id);
    setDrawnEvidence(analysis.evidence);
    setDrawnFieldName(analysis.name || 'Drawn Area');
  }, []);

  const handleResetArea = useCallback(() => {
    setDrawnFieldId(null);
    setDrawnEvidence(null);
    setDrawnFieldName(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6" style={{ paddingBottom: anomaly ? 100 : 24 }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--card-border)] bg-[var(--card-surface)] hover:bg-[var(--card-border)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className={`w-5 h-5 ${lang === 'ur' ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {loading ? t('field.loading') : field?.name || t('field.analysis')}
            </h1>
            {!loading && field && (
              <button
                onClick={() => setShowCropSelector(true)}
                className="flex items-center gap-2 mt-1 text-base text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer group"
              >
                <span className="text-xl">{cropEmojis[field.crop_type] || '🌱'}</span>
                <span className="capitalize">{cropNameKeys[field.crop_type] ? t(cropNameKeys[field.crop_type]) : field.crop_type}</span>
                <span className="text-sm text-[var(--cyan)] opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('field.tapToChange')}
                </span>
                <span className="text-[var(--card-border)]">·</span>
                <span>
                  {field.anomalies?.length === 1 ? t('field.anomalyOne') : t('field.anomalyCount', { count: field.anomalies?.length || 0 })}
                </span>
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAnalysis(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--emerald)] text-[var(--bg-main)] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          {t('field.uploadAnalyze')}
        </button>
      </div>

      {/* Drawn-area override indicator */}
      {drawnFieldId && (
        <div className="flex items-center gap-3 mb-4 p-2.5 rounded-lg bg-[var(--cyan)]/10 border border-[var(--cyan)]/30">
          <MapPin className="w-4 h-4 text-[var(--cyan)] shrink-0" />
          <span className="text-sm text-[var(--text-primary)]">
            Showing data for <span className="font-medium">{drawnFieldName}</span>
          </span>
          <button
            onClick={handleResetArea}
            className="ml-auto flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      )}

      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Map + Timeline (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          <FieldMap
            fieldId={fieldId}
            onAreaAnalyzed={handleAreaAnalyzed}
            resetKey={drawnFieldId ? `drawn-${drawnFieldId}` : null}
          />
          <HealthTimeline fieldId={drawnFieldId || fieldId} />
        </div>

        {/* Right Column: Evidence + Diagnosis + Recommendation (2/5) */}
        <div className="lg:col-span-2">
          {loading ? (
            <SidebarSkeleton />
          ) : drawnFieldId ? (
            <div className="space-y-6">
              <EvidenceCard evidence={drawnEvidence} fieldId={drawnFieldId} />
            </div>
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

      {/* Crop Selector Modal */}
      <CropSelectorModal
        isOpen={showCropSelector}
        onClose={() => setShowCropSelector(false)}
        fieldId={fieldId}
        currentCropType={field?.crop_type}
        onCropChanged={handleCropChanged}
      />

      {/* Analysis Modal */}
      {showAnalysis && (
        <AnalysisFlow
          fieldId={fieldId}
          onComplete={handleAnalyzeComplete}
          onClose={() => setShowAnalysis(false)}
        />
      )}

      {/* Audio Alert Player */}
      {anomaly && (
        <AudioAlertPlayer
          text={fieldVoiceText}
          playing={voicePlaying}
          onPlay={() => setVoicePlaying(true)}
          onPause={() => setVoicePlaying(false)}
        />
      )}
    </div>
  );
}
