"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { getCrops, updateFieldCrop } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const cropStyles = {
  wheat: { bg: 'linear-gradient(135deg, rgba(180,130,40,0.35) 0%, rgba(160,100,20,0.15) 100%)', ring: '#D4A017' },
  rice: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.15) 100%)', ring: '#10B981' },
  cotton: { bg: 'linear-gradient(135deg, rgba(34,197,94,0.35) 0%, rgba(22,163,74,0.15) 100%)', ring: '#22C55E' },
  sugarcane: { bg: 'linear-gradient(135deg, rgba(132,204,22,0.35) 0%, rgba(101,163,13,0.15) 100%)', ring: '#84CC16' },
};

const cropEmojis = {
  wheat: '🌾',
  rice: '🍚',
  cotton: '🌿',
  sugarcane: '🎋',
};

export default function CropSelectorModal({ isOpen, onClose, fieldId, currentCropType, onCropChanged }) {
  const { t } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setConfirmation(null);
    getCrops()
      .then(data => setCrops(data))
      .catch(() => setCrops([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => {
      onClose();
      if (onCropChanged) onCropChanged();
    }, 1800);
    return () => clearTimeout(timer);
  }, [confirmation, onClose, onCropChanged]);

  const handleSelect = async (cropId) => {
    if (cropId === currentCropType || updating) return;
    setUpdating(true);
    try {
      const result = await updateFieldCrop(fieldId, cropId);
      const selectedCrop = crops.find(c => c.crop_id === cropId);
      const tip = result?.rotation_advice?.rotation_tip || selectedCrop?.rotation_benefits || '';
      setConfirmation({ cropId, cropName: selectedCrop?.name || cropId, tip });
    } catch {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !confirmation) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-card w-full max-w-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            {!confirmation && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--card-border)] hover:bg-[var(--text-muted)] transition-colors text-[var(--text-primary)]"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            <AnimatePresence mode="wait">
              {confirmation ? (
                /* Confirmation Step */
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                    className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
                    style={{ background: 'rgba(16,185,129,0.2)' }}
                  >
                    <Check className="w-10 h-10 text-[var(--emerald)]" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    ✅ {t('crop.selected', { name: confirmation.cropName })}
                  </h3>
                  {confirmation.tip && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-base text-[var(--amber)] mt-3 max-w-xs"
                    >
                      💡 {confirmation.tip}
                    </motion.p>
                  )}
                </motion.div>
              ) : (
                /* Crop Selection Grid */
                <motion.div key="selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">
                    {t('crop.selectCrop')}
                  </h2>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {crops.map((crop) => {
                        const style = cropStyles[crop.crop_id] || cropStyles.wheat;
                        const emoji = cropEmojis[crop.crop_id] || '🌱';
                        const isCurrent = crop.crop_id === currentCropType;

                        return (
                          <motion.button
                            key={crop.crop_id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelect(crop.crop_id)}
                            disabled={isCurrent || updating}
                            className="relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all text-center"
                            style={{
                              background: style.bg,
                              borderColor: isCurrent ? style.ring : 'var(--card-border)',
                              opacity: updating && !isCurrent ? 0.5 : 1,
                              cursor: isCurrent ? 'default' : 'pointer',
                              minHeight: 180,
                            }}
                          >
                            {/* Current Badge */}
                            {isCurrent && (
                              <span
                                className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: `${style.ring}30`, color: style.ring }}
                              >
                                {t('crop.current')}
                              </span>
                            )}

                            {/* Emoji */}
                            <span className="text-5xl mb-3 block">{emoji}</span>

                            {/* Crop Name */}
                            <span className="text-lg font-bold text-[var(--text-primary)] block">
                              {crop.name}
                            </span>

                            {/* Local Name */}
                            <span className="text-sm text-[var(--text-muted)] block mt-0.5">
                              {crop.local_name?.split('(')[1]?.replace(')', '') || crop.local_name}
                            </span>

                            {/* Season Badge */}
                            <span
                              className="text-xs font-semibold mt-2 px-3 py-1 rounded-full"
                              style={{
                                background: crop.season === 'Rabi' ? 'rgba(6,182,212,0.2)' : 'rgba(245,158,11,0.2)',
                                color: crop.season === 'Rabi' ? 'var(--cyan)' : 'var(--amber)',
                              }}
                            >
                              {crop.season}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
