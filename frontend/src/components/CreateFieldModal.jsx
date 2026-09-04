"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Sprout, Loader2, Check } from 'lucide-react';
import { getCrops, createField, analyzeArea } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const cropEmojis = {
  wheat: '🌾',
  rice: '🍚',
  cotton: '🌿',
  sugarcane: '🎋',
};

export default function CreateFieldModal({ isOpen, onClose, polygonCoords, onComplete }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [crops, setCrops] = useState([]);
  const [step, setStep] = useState('form'); // form | creating | analyzing | done
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCropType('');
      setStep('form');
      setError(null);
      getCrops().then(setCrops).catch(() => setCrops([]));
    }
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !cropType) return;

    setStep('creating');
    setError(null);

    try {
      // 1. Create field from drawn polygon
      const field = await createField({
        name: name.trim(),
        crop_type: cropType,
        polygon: polygonCoords,
      });

      // 2. Analyze the area
      setStep('analyzing');
      const analysis = await analyzeArea(field.field_id);

      // 3. Done
      setStep('done');
      setTimeout(() => {
        onClose();
        if (onComplete) onComplete(field.field_id, analysis);
      }, 1200);
    } catch (err) {
      console.error('Failed to create field:', err);
      setError(err.message || 'Failed to create field. Please try again.');
      setStep('form');
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => e.target === e.currentTarget && step === 'form' && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card p-6 w-full max-w-md space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {step === 'done' ? 'Field Created!' : 'New Field from Drawing'}
            </h2>
            {step === 'form' && (
              <button onClick={onClose} className="p-1 rounded hover:bg-[var(--card-border)] transition-colors">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            )}
          </div>

          {/* Polygon preview */}
          {polygonCoords && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--card-surface)] rounded-lg px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-[var(--cyan)]" />
              <span>
                {polygonCoords.length} points drawn
                {polygonCoords[0] && ` — center ~${polygonCoords[0][0].toFixed(3)}, ${polygonCoords[0][1].toFixed(3)}`}
              </span>
            </div>
          )}

          {/* Step: form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Field Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. North Wheat Plot"
                  className="input-field text-sm"
                  autoFocus
                  required
                />
              </div>

              {/* Crop type */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Crop Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {crops.map((crop) => (
                    <button
                      key={crop.crop_id}
                      type="button"
                      onClick={() => setCropType(crop.crop_id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        cropType === crop.crop_id
                          ? 'border-[var(--emerald)] bg-[var(--emerald)]/10 text-[var(--emerald)]'
                          : 'border-[var(--card-border)] bg-[var(--card-surface)] text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <span>{cropEmojis[crop.crop_id] || '🌱'}</span>
                      <span>{crop.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-[var(--crimson)]">{error}</p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || !cropType}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Sprout className="w-4 h-4" />
                Create & Analyze Field
              </button>
            </form>
          )}

          {/* Step: creating / analyzing */}
          {(step === 'creating' || step === 'analyzing') && (
            <div className="flex flex-col items-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 text-[var(--cyan)] animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">
                {step === 'creating'
                  ? 'Creating field & registering polygon on Agromonitoring...'
                  : 'Fetching live soil, NDVI, and weather data...'}
              </p>
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--emerald)]/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-[var(--emerald)]" />
              </div>
              <p className="text-sm text-[var(--text-primary)] font-medium">Field created and analyzed!</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
