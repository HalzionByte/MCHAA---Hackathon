"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Download,
  Brain,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Globe,
  FileJson,
  Layers,
  Send,
  X,
  ArrowLeft,
  RefreshCw,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { getPakAgriDatasetStats, exportPakAgriDataset, submitRLHFFeedback } from '../../api/api';

const FORMAT_INFO = {
  jsonl: {
    label: 'JSONL',
    icon: FileJson,
    description: 'JSON Lines format — each record is a newline-delimited JSON object. Compatible with Hugging Face datasets, OpenAI fine-tuning, and standard NLP toolchains.',
    color: 'var(--cyan)',
    bg: 'var(--cyan)',
  },
  coco: {
    label: 'COCO',
    icon: Layers,
    description: 'COCO Object Detection format — annotations + categories. Compatible with Detectron2, MMDetection, Roboflow, and standard vision model trainers.',
    color: '#f59e0b',
    bg: '#f59e0b',
  },
  huggingface: {
    label: 'HuggingFace',
    icon: Package,
    description: 'HuggingFace datasets format — schema-aware row/column format, directly loadable with `datasets.load_dataset()`.',
    color: '#a78bfa',
    bg: '#a78bfa',
  },
};

function StatBadge({ label, value, color }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1 rounded-xl border border-[var(--card-border)]">
      <div className="text-xs text-[var(--text-muted)] font-medium">{label}</div>
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
    </div>
  );
}

function RLHFModal({ isOpen, onClose, anomalies }) {
  const [anomalyId, setAnomalyId] = useState('');
  const [agronomistLabel, setAgronomistLabel] = useState('pest_infestation');
  const [correctedCause, setCorrectedCause] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!anomalyId || !agronomistLabel) return;
    setSubmitting(true);
    try {
      const res = await submitRLHFFeedback({ anomalyId, agronomistLabel, correctedCause, notes });
      setResult(res);
    } catch (err) {
      console.error('RLHF submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-6 w-full max-w-lg space-y-4 border border-[var(--card-border)] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Submit RLHF Label Correction
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          {result ? (
            <div className="py-4 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-emerald-300">{result.message}</h4>
              <p className="text-xs text-[var(--text-muted)]">Anomaly: {result.anomaly_id}</p>
              <button
                onClick={() => { setResult(null); onClose(); }}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:opacity-90"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1 font-medium">Anomaly ID</label>
                <input
                  type="text"
                  value={anomalyId}
                  onChange={(e) => setAnomalyId(e.target.value)}
                  placeholder="Enter anomaly UUID"
                  className="w-full bg-[var(--card-surface)] border border-[var(--card-border)] text-xs rounded-lg p-2.5 text-[var(--text-primary)] font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1 font-medium">Corrected Label (Agronomist Ground Truth)</label>
                <select
                  value={agronomistLabel}
                  onChange={(e) => setAgronomistLabel(e.target.value)}
                  className="w-full bg-[var(--card-surface)] border border-[var(--card-border)] text-xs rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-purple-400"
                >
                  <option value="water_stress">Water Stress</option>
                  <option value="waterlogging">Waterlogging</option>
                  <option value="pest_infestation">Pest Infestation</option>
                  <option value="fungal_disease">Fungal Disease</option>
                  <option value="nutrient_deficiency">Nutrient Deficiency</option>
                  <option value="healthy">Healthy (False Positive)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1 font-medium">Corrected Root Cause (Optional)</label>
                <input
                  type="text"
                  value={correctedCause}
                  onChange={(e) => setCorrectedCause(e.target.value)}
                  placeholder="e.g. Aphid infestation on leaf underside"
                  className="w-full bg-[var(--card-surface)] border border-[var(--card-border)] text-xs rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1 font-medium">Agronomist Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--card-surface)] border border-[var(--card-border)] text-xs rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-purple-400 resize-none"
                  placeholder="Additional context for fine-tuning pipeline..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!anomalyId || submitting}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit to RLHF Fine-Tuning Pipeline
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function PakAgriVisionPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('jsonl');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [showRLHF, setShowRLHF] = useState(false);
  const [exportLimit, setExportLimit] = useState(500);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getPakAgriDatasetStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load PakAgri stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const data = await exportPakAgriDataset(selectedFormat, exportLimit);
      setExportResult(data);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const content = JSON.stringify(exportResult.data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pakagri-vision-${selectedFormat}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const FmtInfo = FORMAT_INFO[selectedFormat];
  const FmtIcon = FmtInfo.icon;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8" style={{ paddingBottom: 80 }}>
      {/* Page Header */}
      <header className="glass-card p-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--card-border)] bg-[var(--card-surface)] hover:bg-[var(--card-border)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/15 border border-green-500/30">
                <Globe className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
                    🇵🇰 PakAgri-Vision
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                    Sovereign AI Dataset
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Pakistan's National Agricultural AI Training Benchmark — Open for Researchers, Universities & Government
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRLHF(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold text-xs hover:bg-purple-600/30 transition-all"
          >
            <Brain className="w-4 h-4" />
            Submit RLHF Correction
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-3xl">
          MCHAA continuously builds <strong className="text-[var(--text-primary)]">PakAgri-Vision</strong> — Pakistan's first sovereign open agricultural AI dataset, 
          capturing field images, satellite telemetry, regional crop strains (<em>Basmati-385, Sindh-Cotton NIAB-78, Pak-81 Wheat</em>), 
          and human agronomist-verified labels into a continuous AI data flywheel for universities, PARC, and AI research institutions.
        </p>
      </header>

      {/* Live Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse h-20 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBadge label="Total Training Records" value={stats.total_records} color="var(--cyan)" />
            <StatBadge label="Total Fields Covered" value={stats.total_fields} color="var(--emerald)" />
            <StatBadge label="Crop Strains Catalogued" value={Object.values(stats.crop_strains_covered || {}).flat().length} color="#f59e0b" />
            <StatBadge label="Export Formats" value={stats.export_formats?.length || 3} color="#a78bfa" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Anomaly Breakdown */}
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Anomaly Label Distribution
              </h3>
              {Object.entries(stats.anomaly_breakdown || {}).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">No anomaly records yet — run field analyses to populate the dataset.</p>
              ) : (
                Object.entries(stats.anomaly_breakdown).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)] w-36 capitalize">{type.replace(/_/g, ' ')}</span>
                    <div className="flex-1 bg-[var(--card-surface)] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-[var(--cyan)]"
                        style={{ width: `${Math.min(100, (count / (stats.total_records || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[var(--text-muted)] w-6 text-right">{count}</span>
                  </div>
                ))
              )}
            </div>

            {/* Crop Strains */}
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" /> Pakistani Crop Strains Indexed
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.crop_strains_covered || {}).map(([crop, strains]) => (
                  <div key={crop}>
                    <span className="text-xs font-bold text-[var(--text-primary)] capitalize">{crop}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {strains.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Region + Label Quality */}
          <div className="glass-card p-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-primary)]">Region Coverage:</span>
            {(stats.region_coverage || []).map((r) => (
              <span key={r} className="px-2 py-0.5 rounded bg-[var(--card-surface)] border border-[var(--card-border)]">{r}</span>
            ))}
            <span className="ms-auto text-[var(--emerald)] font-medium">
              Label Quality: {stats.label_quality}
            </span>
          </div>
        </div>
      ) : null}

      {/* Export Panel */}
      <div className="glass-card p-6 space-y-5">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Database className="w-5 h-5 text-[var(--cyan)]" /> Dataset Export
        </h2>

        {/* Format selector */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(FORMAT_INFO).map(([key, info]) => {
            const Icon = info.icon;
            const selected = selectedFormat === key;
            return (
              <button
                key={key}
                onClick={() => { setSelectedFormat(key); setExportResult(null); }}
                className={`p-4 rounded-xl border text-left transition-all space-y-2 ${
                  selected
                    ? 'ring-1 ring-[var(--cyan)] border-[var(--cyan)] bg-[var(--cyan)]/10'
                    : 'border-[var(--card-border)] bg-[var(--card-surface)] hover:border-[var(--cyan)]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: info.color }} />
                  <span className="font-bold text-sm text-[var(--text-primary)]">{info.label}</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{info.description}</p>
              </button>
            );
          })}
        </div>

        {/* Limit + Export Button */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">Max Records:</label>
            <select
              value={exportLimit}
              onChange={(e) => setExportLimit(Number(e.target.value))}
              className="bg-[var(--card-surface)] border border-[var(--card-border)] text-xs rounded-lg p-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--cyan)]"
            >
              <option value={10}>10 (Preview)</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyan)] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? 'Generating...' : `Generate ${FORMAT_INFO[selectedFormat].label} Export`}
          </button>
        </div>

        {/* Export Result Preview */}
        <AnimatePresence>
          {exportResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    <strong className="text-[var(--text-primary)]">{exportResult.record_count}</strong> records exported &nbsp;·&nbsp;
                    MD5: <span className="font-mono">{exportResult.checksum_md5?.slice(0, 12)}...</span>
                  </span>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .json
                </button>
              </div>

              <pre className="bg-[var(--bg-main)] border border-[var(--card-border)] rounded-xl p-4 text-[10px] font-mono text-[var(--text-muted)] overflow-x-auto max-h-56 overflow-y-auto">
                {JSON.stringify(exportResult.data, null, 2).slice(0, 3000)}
                {JSON.stringify(exportResult.data, null, 2).length > 3000 ? '\n... (truncated for preview)' : ''}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RLHFModal isOpen={showRLHF} onClose={() => setShowRLHF(false)} />
    </div>
  );
}
