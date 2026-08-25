"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import FieldMap from '../../../components/FieldMap';
import AnalysisFlow from '../../../components/AnalysisFlow';

export default function FieldPage() {
  const { fieldId } = useParams();
  const router = useRouter();
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleAnalyzeComplete = (anomalyId) => {
    setShowAnalysis(false);
    router.push(`/anomaly/${anomalyId}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Field Analysis</h1>
        <button
          onClick={() => setShowAnalysis(true)}
          className="btn-primary"
        >
          Upload & Analyze Image
        </button>
      </div>
      <FieldMap fieldId={fieldId} />
      <AnalysisFlow
        fieldId={fieldId}
        onComplete={handleAnalyzeComplete}
        onClose={() => setShowAnalysis(false)}
      />
    </div>
  );
}