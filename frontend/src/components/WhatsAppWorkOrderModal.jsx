"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageSquare,
  Volume2,
  VolumeX,
  ExternalLink,
  CheckCircle2,
  Phone,
  User,
  Sparkles,
  Camera,
  Send
} from 'lucide-react';
import { createWhatsAppWorkOrder, confirmWorkOrder } from '../api/api';

export default function WhatsAppWorkOrderModal({ isOpen, onClose, fieldId, anomalyId, action, sector = "Zone B3" }) {
  const [dialect, setDialect] = useState('ur');
  const [workerName, setWorkerName] = useState('Tariq Mahmood');
  const [workerPhone, setWorkerPhone] = useState('+923009876543');
  const [dosage, setDosage] = useState('250 ml/acre Chlorpyrifos');
  
  const [loading, setLoading] = useState(false);
  const [workOrder, setWorkOrder] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1592982537447-7440770cbfc9');
  const [confirmNote, setConfirmNote] = useState('Completed pesticide spray across Sector B3 as instructed.');

  useEffect(() => {
    if (!isOpen) return;

    async function generateOrder() {
      setLoading(true);
      try {
        const res = await createWhatsAppWorkOrder({
          fieldId: fieldId || 'field-001',
          anomalyId: anomalyId || null,
          workerName,
          workerPhone,
          dialect,
          sector,
          action: action || 'Infestation Treatment',
          dosage
        });
        setWorkOrder(res);
      } catch (err) {
        console.error('Failed to generate WhatsApp work order:', err);
      } finally {
        setLoading(false);
      }
    }

    generateOrder();
  }, [isOpen, dialect, fieldId, anomalyId, action, sector, dosage]);

  const handlePlayVoice = () => {
    if (!workOrder?.spoken_audio_script) return;

    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(workOrder.spoken_audio_script);
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleConfirmTask = async () => {
    if (!workOrder) return;
    setConfirming(true);
    try {
      const res = await confirmWorkOrder({
        workOrderId: workOrder.work_order_id,
        photoUrl,
        note: confirmNote
      });
      setConfirmedData(res);
    } catch (err) {
      console.error('Failed to confirm work order:', err);
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2500] flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card p-6 w-full max-w-lg space-y-5 border border-[var(--card-border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  WhatsApp "Audio Work Order"
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Voice Dispatch
                  </span>
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Bridge literacy barriers with localized 15s Urdu/Regional voice notes
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dialect Selector Tabs */}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
              Select Regional Voice Dialect
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'ur', label: 'اردو Urdu', flag: '🇵🇰' },
                { id: 'pa', label: 'پنجابی Punjabi', flag: '🌾' },
                { id: 'sd', label: 'سنڌي Sindhi', flag: '🏞️' },
                { id: 'en', label: 'English', flag: '🇬🇧' }
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDialect(d.id)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                    dialect === d.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-[var(--card-surface)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <span className="text-sm">{d.flag}</span>
                  <span className="truncate max-w-full">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Worker Details Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[var(--text-muted)] block mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-[var(--cyan)]" /> Laborer Name
              </label>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full bg-[var(--card-surface)] border border-[var(--card-border)] text-xs rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--text-muted)] block mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-[var(--cyan)]" /> WhatsApp Phone
              </label>
              <input
                type="text"
                value={workerPhone}
                onChange={(e) => setWorkerPhone(e.target.value)}
                className="w-full bg-[var(--card-surface)] border border-[var(--card-border)] text-xs rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Audio Script & Preview Player */}
          {loading ? (
            <div className="py-6 text-center text-xs text-[var(--text-muted)]">
              <div className="animate-spin w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-2" />
              Synthesizing voice work order...
            </div>
          ) : workOrder ? (
            <div className="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Synthesized 15-Second Voice Script
                </span>
                <button
                  onClick={handlePlayVoice}
                  className="px-3 py-1 rounded-lg bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" /> Stop Voice
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" /> Preview Audio
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs italic text-emerald-200/90 leading-relaxed font-mono bg-black/30 p-2.5 rounded-lg border border-emerald-500/20">
                "{workOrder.spoken_audio_script}"
              </p>
            </div>
          ) : null}

          {/* Task Confirmation Tracker */}
          {confirmedData ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <h4 className="text-xs font-bold text-emerald-300">Task Completed & Verified!</h4>
              <p className="text-[11px] text-emerald-200">{confirmedData.message}</p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[var(--card-surface)] border border-[var(--card-border)] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                <span className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-[var(--cyan)]" /> Laborer Task Confirmation Simulator
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Photo / Voice Note Response</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  className="flex-1 bg-[var(--bg-main)] border border-[var(--card-border)] text-xs rounded-lg p-2 text-[var(--text-primary)]"
                />
                <button
                  onClick={handleConfirmTask}
                  disabled={confirming}
                  className="px-3 py-2 rounded-lg bg-[var(--cyan)] text-black font-bold text-xs flex items-center gap-1 hover:opacity-90 disabled:opacity-50"
                >
                  {confirming ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

          {/* WhatsApp Deep Link Button */}
          {workOrder && (
            <a
              href={workOrder.whatsapp_deep_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-[#25D366] text-black font-extrabold text-sm flex items-center justify-center gap-2.5 hover:bg-[#20bd5a] transition-colors shadow-lg shadow-emerald-950/40"
            >
              <Send className="w-5 h-5 fill-black" />
              Launch WhatsApp Voice Dispatch to {workerPhone}
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
