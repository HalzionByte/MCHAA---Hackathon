import React from 'react';
import { useRouter, useParams } from 'next/router';
import AnomalyDetailed from '../../components/AnomalyDetailed';

export default function AnomalyPage() {
  const router = useRouter();
  const { anomalyId } = useParams();

  if (!anomalyId) return <div>Loading...</div>;

  return (
    <div className="min-h-screen">
      <button onClick={() => router.back()}>← Back</button>
      <AnomalyDetailed anomalyId={anomalyId} />
    </div>
  );
}