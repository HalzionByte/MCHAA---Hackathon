"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Image as ImageIcon, Search, Brain, AlertTriangle, ExternalLink } from 'lucide-react';
import { analyzeImage } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sampleImages = [
  { id: 1, url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400', key: 'analysis.wheatField' },
  { id: 2, url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400', key: 'analysis.ricePaddy' },
  { id: 3, url: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=300&q=80', key: 'analysis.dryCrop' },
];

export default function AnalysisFlow({ fieldId, onComplete, onClose }) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [resultData, setResultData] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const selectSampleImage = (url) => {
    setImagePreview(url);
    setImageFile(null);
  };

  const steps = [
    { id: 'upload', label: t('analysis.upload'), icon: ImageIcon, desc: t('analysis.uploadDesc') },
    { id: 'detect', label: t('analysis.detect'), icon: Search, desc: t('analysis.detectDesc') },
    { id: 'correlate', label: t('analysis.correlate'), icon: Brain, desc: t('analysis.correlateDesc') },
    { id: 'diagnose', label: t('analysis.diagnose'), icon: AlertTriangle, desc: t('analysis.diagnoseDesc') },
  ];

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const runAnalysis = async () => {
    if (!imageFile && !imagePreview) {
      setError(t('analysis.selectImage'));
      return;
    }

    setError(null);
    const stepIds = ['detect', 'correlate', 'diagnose'];

    for (const stepId of stepIds) {
      setCurrentStep(steps.findIndex(s => s.id === stepId));
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    }

    try {
      const imageUrl = imageFile ? await fileToBase64(imageFile) : imagePreview;
      const result = await analyzeImage(imageUrl, fieldId);

      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 800));

      if (result && result.anomaly_id && UUID_RE.test(result.anomaly_id)) {
        setResultData(result);
      } else if (result) {
        setResultData(result);
        console.error('Analysis returned result but missing anomaly_id:', result);
      } else {
        setError(t('analysis.unexpectedResult'));
        setCurrentStep(0);
      }
    } catch (err) {
      setError(t('analysis.failed'));
      setCurrentStep(0);
      console.error(err);
    }
  };

  const handleViewResults = () => {
    if (resultData?.anomaly_id && UUID_RE.test(resultData.anomaly_id)) {
      onComplete(resultData.anomaly_id);
    }
  };

  if (!onClose) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-strong w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('analysis.title')}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--card-surface)] transition-colors text-muted hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-[var(--card-border)] bg-[var(--bg-main)]/50">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--card-border)]" />
              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  layoutId={step.id}
                  className="flex flex-col items-center z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      i < currentStep
                        ? 'bg-[var(--cyan)] border-[var(--cyan)] text-[var(--bg-main)]'
                        : i === currentStep
                        ? 'bg-[var(--card-surface)] border-[var(--cyan)] text-[var(--cyan)] step-active-glow'
                        : 'bg-[var(--card-surface)] border-[var(--card-border)] text-[var(--text-muted)]'
                    }`}
                  >
                    {i < currentStep ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium mt-1 ${i <= currentStep ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <AnimatePresence mode="wait">
              {currentStep === 0 && !resultData && (
                <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <p className="text-muted text-center mb-4">{t('analysis.dropzone')}</p>

                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      dragActive
                        ? 'border-[var(--cyan)] bg-[var(--cyan)]/10'
                        : 'border-[var(--card-border)] hover:border-[var(--cyan)]/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted" />
                    <p className="text-muted mb-1">{t('analysis.dragDrop')}</p>
                    <p className="text-xs text-muted">{t('analysis.fileTypes')}</p>
                  </div>

                  {imagePreview && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative mt-4">
                      <img src={imagePreview} alt={t('analysis.preview')} className="w-full max-h-64 object-cover rounded-lg" />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 end-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  <p className="text-xs text-muted text-center mt-4">{t('analysis.orSample')}</p>
                  <div className="flex gap-2 justify-center flex-wrap mt-2">
                    {sampleImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => selectSampleImage(img.url)}
                        className="relative group overflow-hidden rounded-lg border border-[var(--card-border)]"
                      >
                        <img src={img.url} alt={t(img.key)} className="w-24 h-20 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white font-medium">{t('analysis.useSample', { label: t(img.key) })}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={runAnalysis}
                      disabled={!imagePreview}
                      className="btn-primary px-6"
                    >
                      {t('analysis.start')}
                    </button>
                  </div>

                  {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
                </motion.div>
              )}

              {currentStep > 0 && currentStep < 3 && !resultData && (
                <motion.div
                  key={steps[currentStep].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--cyan)]/20 mb-4">
                    <Loader2 className="w-10 h-10 text-[var(--cyan)] animate-spin" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">{steps[currentStep].label}</h3>
                  <p className="text-muted text-sm">{steps[currentStep].desc}</p>
                  <div className="mt-6 flex justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[var(--cyan)]"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && resultData && (
                <motion.div key="results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--cyan)] mb-3"
                    >
                      <Check className="w-8 h-8 text-[var(--bg-main)]" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-1">{t('analysis.complete')}</h3>
                    <p className="text-muted text-sm mb-4">{t('analysis.completeMsg')}</p>
                  </div>

                  <div className="flex gap-3 justify-center pt-2 pb-2">
                    {resultData.anomaly_id && UUID_RE.test(resultData.anomaly_id) && (
                      <button onClick={handleViewResults} className="btn-primary px-6 flex items-center gap-2">
                        {t('analysis.viewResults')}
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-surface)] transition-colors">
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
