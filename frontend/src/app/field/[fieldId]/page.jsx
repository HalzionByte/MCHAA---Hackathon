"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import FieldMap from '../../../components/FieldMap';
import ImageUpload from '../../../components/ImageUpload';

export default function FieldPage() {
  const { fieldId } = useParams();
  const router = useRouter();
  
  const handleAnalyzeComplete = (anomalyId) => {
    router.push(`/anomaly/${anomalyId}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <FieldMap fieldId={fieldId} />
      <ImageUpload fieldId={fieldId} onAnalyzeComplete={handleAnalyzeComplete} />
    </div>
  );
}