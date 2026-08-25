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

  if (loading) return <div>Loading anomaly data...</div>;
  if (!anomaly) return <div>Anomaly not found</div>;

  // Severity color based on threshold
  const severity = anomaly.severity;
  const severityColor = severity > 0.7 ? 'var(--crimson)' : 
                       severity > 0.3 ? 'var(--amber)' : 'var(--emerald)';

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Anomaly Analysis</h2>
      
      <div className="glass p-4 rounded-md mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Analysis #{anomaly.anomaly_id}</h2>
          <span className="text-sm">
            Zone: {anomaly.detected_region.zone} | 
            Type: {anomaly.anomaly_type}
          </span>
        </div>
        
        <div className="mt-3">
          <div className="w-full bg-muted/30 rounded-full h-2">
            <div 
              className="h-full rounded-full" 
              style={{ width: `${severity * 100}%`, backgroundColor: severityColor }}
            ></div>
          </div>
          <p className="text-xs mt-1">
            Severity: {((severity * 100).toFixed(0))}% {severityColor === 'var(--crimson)' ? '(Critical)' : ''}
          </p>
        </div>
      </div>

      <div className="bento-grid">
        <EvidenceCard evidence={anomaly.evidence} />
        <DiagnosisCard diagnosis={anomaly.diagnosis} />
        <RecommendationCard recommendation={anomaly.recommendation} />
      </div>
    </div>
  );
}