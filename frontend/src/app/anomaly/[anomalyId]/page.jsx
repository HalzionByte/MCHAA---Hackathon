"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import AnomalyDetailed from '../../../components/AnomalyDetailed';

export default function AnomalyPage() {
  const { anomalyId } = useParams();

  if (!anomalyId) return <div className="p-8 text-center text-muted">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button 
        onClick={() => window.history.back()}
        className="mb-4 text-sm text-muted hover:text-primary transition-colors"
      >
        ← Back to Field
      </button>
      <AnomalyDetailed anomalyId={anomalyId} />
    </div>
  );
}