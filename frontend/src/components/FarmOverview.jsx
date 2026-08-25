"use client";

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

  if (loading) return <div className="p-8 text-center text-muted">Loading farm data...</div>;
  if (!farm) return <div className="p-8 text-center text-muted">Farm not found</div>;

  return (
    <section className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{farm.name}</h1>
        <p className="text-muted">{farm.location}</p>
      </header>
      
      <div className="bento-grid">
        {farm.fields.map((field) => (
          <Link 
            key={field.field_id} 
            href={`/field/${field.field_id}`}
            className="glass p-5 hover:translate-y-[-2px] transition-transform duration-200"
          >
            <h3 className="text-xl font-medium mb-3">{field.name}</h3>
            <div className="space-y-2 mb-4">
              <div className="stat-row">
                <span className="stat-label">Crop</span>
                <span className="stat-value">{field.crop_type}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Anomalies</span>
                <span className="stat-value">{field.anomaly_count}</span>
              </div>
            </div>
            <span className={`badge ${field.status === 'alert' ? 'badge-alert' : 'badge-healthy'}`}>
              {field.status === 'alert' ? '⚠ Alert' : '✓ Healthy'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}