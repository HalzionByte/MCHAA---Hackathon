"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getFarm, deleteField } from '../api/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, AlertTriangle, Upload, CheckCircle2, Leaf, Sprout, Trash2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnalysisFlow from './AnalysisFlow';
import AudioAlertPlayer from './AudioAlertPlayer';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

const HomeMap = dynamic(() => import('./HomeMap'), { ssr: false });

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

function DeleteFieldModal({ isOpen, field, onConfirm, onCancel, deleting }) {
  const { t } = useLanguage();
  if (!isOpen || !field) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card p-6 w-full max-w-md space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Delete Field</h2>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Are you sure you want to delete <span className="font-medium text-[var(--text-primary)]">{field.name}</span>?
            This will permanently remove all its analysis history, anomalies, and evidence data. This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-surface)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--crimson)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {deleting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FieldCard({ field, onDelete }) {
  const { t } = useLanguage();
  const isAlert = field.status === 'alert';
  const emoji = cropEmojis[field.crop_type] || '🌱';
  const cropNameKey = cropNameKeys[field.crop_type];

  return (
    <Link
      href={`/field/${field.field_id}`}
      className="relative glass-card card-hover p-6 flex flex-col gap-5 min-h-[220px]"
    >
      {/* Traffic Light + Field Name Row */}
      <div className="flex items-center gap-5">
        {/* Delete button — top-right of card */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onDelete) onDelete(field);
          }}
          className="absolute top-3 end-3 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-colors z-10"
          title={`Delete ${field.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Giant Traffic Light */}
        <div className="flex-shrink-0 relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: isAlert ? 'var(--crimson)' : 'var(--emerald)',
              boxShadow: isAlert
                ? '0 0 20px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.2)'
                : '0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.2)',
              animation: isAlert ? 'traffic-light-pulse 2s ease-in-out infinite' : 'none',
            }}
          >
            {isAlert ? (
              <AlertTriangle className="w-9 h-9 text-white" />
            ) : (
              <CheckCircle2 className="w-9 h-9 text-white" />
            )}
          </div>
        </div>

        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-[var(--text-primary)] truncate">
            {field.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">{emoji}</span>
            <span className="text-lg text-[var(--text-muted)]">
              {cropNameKey ? t(cropNameKey) : field.crop_type}
            </span>
          </div>
        </div>
      </div>

      {/* Status + Scan Info Row */}
      <div className="flex items-center gap-4 pt-3 border-t border-[var(--card-border)]">
        <span
          className="flex items-center gap-2 text-base font-bold"
          style={{ color: isAlert ? 'var(--crimson)' : 'var(--emerald)' }}
        >
          {isAlert ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              {field.anomaly_count} {field.anomaly_count === 1 ? t('status.issue') : t('status.issues')}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {t('status.healthy')}
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

export default function FarmOverview({ farmId }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [cropFilter, setCropFilter] = useState(null);
  const [healthFilter, setHealthFilter] = useState(null);

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

  const uniqueCrops = useMemo(() => {
    if (!farm?.fields) return [];
    const seen = new Set();
    return farm.fields.filter(f => {
      if (seen.has(f.crop_type)) return false;
      seen.add(f.crop_type);
      return true;
    });
  }, [farm]);

  const filteredFields = useMemo(() => {
    if (!farm?.fields) return [];
    return farm.fields.filter(f => {
      if (cropFilter && f.crop_type !== cropFilter) return false;
      if (healthFilter && f.status !== healthFilter) return false;
      return true;
    });
  }, [farm, cropFilter, healthFilter]);

  const hasActiveAlert = useMemo(() => {
    return filteredFields.some(f => f.status === 'alert');
  }, [filteredFields]);

  const homeSummary = useMemo(() => {
    const alertFields = filteredFields.filter(f => f.status === 'alert');
    if (!alertFields.length) return '';
    const lines = alertFields.map(f => {
      const count = f.anomaly_count;
      return `Field ${f.name} has ${count} ${count === 1 ? 'issue' : 'issues'}.`;
    });
    return lines.join(' ');
  }, [filteredFields]);

  const handleDeleteRequest = (field) => {
    setDeleteTarget(field);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteField(deleteTarget.field_id);
      const data = await getFarm(farmId);
      setFarm(data);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete field:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="glass-card p-8 text-center text-[var(--text-muted)]">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full mx-auto mb-3" />
          {t('farm.loading')}
        </div>
      </div>
    );
  }
  if (!farm) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="glass-card p-8 text-center text-[var(--text-muted)]">{t('farm.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" style={{ paddingBottom: 120 }}>
      {/* Top Header Bar */}
      <header className="glass-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Farm Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--cyan)]/10">
              <Leaf className="w-6 h-6 text-[var(--cyan)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{farm.name}</h1>
              <p className="flex items-center gap-1.5 text-base text-[var(--text-muted)]">
                <MapPin className="w-4 h-4" />
                {farm.location}
              </p>
            </div>
          </div>

          {/* Right: System Status + Language Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="stat-chip text-[var(--cyan)] border-[var(--cyan)]/30">
              <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse-cyan" />
              {t('farm.systemActive')}
            </span>
            <Link
              href="/crops"
              className="stat-chip text-[var(--emerald)] border-[var(--emerald)]/30 hover:bg-[var(--emerald)]/10 transition-colors"
            >
              <Sprout className="w-4 h-4" />
              {t('farm.cropGuide')}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Interactive Map */}
      <HomeMap />

      {/* Field Cards Grid */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">{t('farm.yourFields')}</h2>

        {/* Health Status Filter */}
        {farm.fields.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <button
              onClick={() => setHealthFilter(null)}
              className={`map-chip ${healthFilter === null ? 'map-chip-active' : ''}`}
            >
              {t('farm.allStatus')}
            </button>
            <button
              onClick={() => setHealthFilter('healthy')}
              className={`map-chip ${healthFilter === 'healthy' ? 'map-chip-active' : ''}`}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--emerald)]" />
              {t('farm.healthyFilter')}
            </button>
            <button
              onClick={() => setHealthFilter('alert')}
              className={`map-chip ${healthFilter === 'alert' ? 'map-chip-active' : ''}`}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--crimson)]" />
              {t('farm.issueFilter')}
            </button>
          </div>
        )}

        {/* Crop Type Filter */}
        {uniqueCrops.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <button
              onClick={() => setCropFilter(null)}
              className={`map-chip ${cropFilter === null ? 'map-chip-active' : ''}`}
            >
              {t('farm.allCrops')}
            </button>
            {uniqueCrops.map(f => (
              <button
                key={f.crop_type}
                onClick={() => setCropFilter(cropFilter === f.crop_type ? null : f.crop_type)}
                className={`map-chip ${cropFilter === f.crop_type ? 'map-chip-active' : ''}`}
              >
                <span className="text-base">{cropEmojis[f.crop_type] || '🌱'}</span>
                {cropNameKeys[f.crop_type] ? t(cropNameKeys[f.crop_type]) : f.crop_type}
              </button>
            ))}
          </div>
        )}

        {/* Filtered Field Cards */}
        {filteredFields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFields.map((field) => (
              <FieldCard key={field.field_id} field={field} onDelete={handleDeleteRequest} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-[var(--text-muted)]">
            <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
            {t('farm.noMatchingFields')}
          </div>
        )}
      </div>

      {/* Giant Upload Button */}
      <button
        onClick={() => setShowAnalysis(true)}
        className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[var(--emerald)] text-[var(--bg-main)] font-bold text-xl hover:opacity-90 transition-opacity"
        style={{ minHeight: 80 }}
      >
        <Upload className="w-7 h-7" />
        {t('farm.uploadImage')}
      </button>

      {/* Analysis Modal */}
      {showAnalysis && (
        <AnalysisFlow
          fieldId={farm.fields?.[0]?.field_id || 'field-001'}
          onComplete={(anomalyId) => {
            setShowAnalysis(false);
            router.push(`/anomaly/${anomalyId}`);
          }}
          onClose={() => setShowAnalysis(false)}
        />
      )}

      {/* Delete Field Modal */}
      <DeleteFieldModal
        isOpen={!!deleteTarget}
        field={deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        deleting={deleting}
      />

      {/* Audio Player — only if there's an active alert */}
      {hasActiveAlert && <AudioAlertPlayer text={homeSummary} />}
    </div>
  );
}
