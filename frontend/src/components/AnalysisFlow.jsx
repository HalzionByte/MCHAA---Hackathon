"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Image as ImageIcon, Search, Brain, AlertTriangle } from 'lucide-react';
import { analyzeImage } from '../api/api';

const steps = [
  { id: 'upload', label: 'Upload', icon: ImageIcon, desc: 'Select field image' },
  { id: 'detect', label: 'Detect', icon: Search, desc: 'Finding anomalies' },
  { id: 'correlate', label: 'Correlate', icon: Brain, desc: 'Analyzing evidence' },
  { id: 'diagnose', label: 'Diagnose', icon: AlertTriangle, desc: 'Generating report' },
];

const sampleImages = [
  { id: 1, url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400', label: 'Wheat field' },
  { id: 2, url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400', label: 'Rice paddy' },
  { id: 3, url: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=300&q=80', label: 'Dry crop' },
];

export default function AnalysisFlow({ fieldId, onComplete, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [completedAnomalyId, setCompletedAnomalyId] = useState(null);

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

  const runAnalysis = async () => {
    if (!imageFile && !imagePreview) {
      setError('Please select an image first');
      return;
    }

    setError(null);
    const stepIds = ['detect', 'correlate', 'diagnose'];

    for (const stepId of stepIds) {
      setCurrentStep(steps.findIndex(s => s.id === stepId));
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    }

    try {
      const imageUrl = imageFile ? URL.createObjectURL(imageFile) : imagePreview;
      const result = await analyzeImage(imageUrl, fieldId);

      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 800));

      if (result?.anomaly_id) {
        setCompletedAnomalyId(result.anomaly_id);
      } else {
        setError('Analysis returned unexpected result. Please try again.');
        setCurrentStep(0);
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
      setCurrentStep(0);
      console.error(err);
    }
  };

  if (!onClose) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
            <h2 className="text-xl font-semibold">Analyze Field Image</h2>
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
              {currentStep === 0 && (
                <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <p className="text-muted text-center mb-4">Drop a field image or select from samples</p>

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
                    <p className="text-muted mb-1">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted">PNG, JPG up to 10MB</p>
                  </div>

                  {imagePreview && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative mt-4">
                      <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  <p className="text-xs text-muted text-center mt-4">or choose a sample:</p>
                  <div className="flex gap-2 justify-center flex-wrap mt-2">
                    {sampleImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => selectSampleImage(img.url)}
                        className="relative group overflow-hidden rounded-lg border border-[var(--card-border)]"
                      >
                        <img src={img.url} alt={img.label} className="w-24 h-20 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white font-medium">Use {img.label}</span>
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
                      Start Analysis
                    </button>
                  </div>

                  {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
                </motion.div>
              )}

              {currentStep > 0 && currentStep < 3 && (
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

              {currentStep === 3 && (
                <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--cyan)] mb-4"
                  >
                    <Check className="w-10 h-10 text-[var(--bg-main)]" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">Analysis Complete</h3>
                  <p className="text-muted mb-6">Anomaly detected and diagnosed successfully</p>
                  <button
                    onClick={() => onComplete(completedAnomalyId)}
                    className="btn-primary px-8"
                  >
                    View Results
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
