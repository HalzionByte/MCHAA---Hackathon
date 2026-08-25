"use client";

import React, { useState, useEffect } from 'react';
import { getAnomaly } from '../api/api';
import EvidenceCard from './EvidenceCard';
import DiagnosisCard from './DiagnosisCard';
import RecommendationCard from './RecommendationCard';

export default function AnomalyDetailed({ anomalyId }) {
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnomaly() {
      try {
        const data = await getAnomaly(anomalyId);
        setAnomaly(data);
      } catch (error) {
        console.error('Failed to load anomaly:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAnomaly();
  }, [anomalyId]);

  if (loading) return <div className="p-8 text-center text-muted">Loading anomaly data...</div>;
  if (!anomaly) return <div className="p-8 text-center text-muted">Anomaly not found</div>;

  const severity = anomaly.severity;
  const severityColor = severity > 0.7 ? 'var(--crimson)' : 
                       severity > 0.3 ? 'var(--amber)' : 'var(--emerald)';
  const severityLabel = severity > 0.7 ? 'Critical' : severity > 0.3 ? 'Moderate' : 'Low';

  return (
    <div className="p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Anomaly Analysis</h2>
        <p className="text-muted">#{anomaly.anomaly_id} • {anomaly.detected_region.zone} • {anomaly.anomaly_type.replace('_', ' ')}</p>
      </header>

      <div className="glass p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="badge badge-alert">Active</span>
            <span className="badge" style={{ background: `${severityColor}15`, color: severityColor }}>
              {severityLabel} ({(severity * 100).toFixed(0)}%)
            </span>
          </div>
          <span className="text-sm text-muted">AI Confidence: {(anomaly.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${severity * 100}%`, backgroundColor: severityColor }}
          ></div>
        </div>
        <p className="text-xs text-muted mt-2">Severity progression: {(severity * 100).toFixed(0)}%</p>
      </div>

      <div className="bento-grid">
        <EvidenceCard evidence={anomaly.evidence} />
        <DiagnosisCard diagnosis={anomaly.diagnosis} />
        <RecommendationCard recommendation={anomaly.recommendation} />
      </div>
    </div>
  );
}