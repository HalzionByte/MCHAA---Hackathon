import React, { useState, useEffect } from 'react';
import { getFarm } from '../api/api';
import Link from 'next/link';

export default function FarmOverview({ farmId }) {
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading farm data...</div>;
  if (!farm) return <div>Farm not found</div>;

  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold mb-4">{farm.name}</h1>
      <p className="text-muted mb-6">{farm.location}</p>
      
      <div className="bento-grid">
        {farm.fields.map((field) => (
          <Link 
            key={field.field_id} 
            href={`/field/${field.field_id}`}
            className="glass p-4 rounded-lg hover:translate-y-1 transition-transform"
          >
            <h3 className="text-xl font-medium mb-2">{field.name}</h3>
            <p className="text-sm text-muted mb-1">Crop: {field.crop_type}</p>
            <p className="text-sm text-muted mb-1">Anomalies: {field.anomaly_count}</p>
            
            <span 
              className={`status-badge ${field.status === 'alert' ? 'alert' : 'healthy'}`}
            >
              {field.status === 'alert' ? '⚠️ Alert' : '✓ Healthy'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}