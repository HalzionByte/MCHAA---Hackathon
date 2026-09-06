"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AudioAlertPlayer({ text, playing, onPlay, onPause, label }) {
  const { t, lang } = useLanguage();

  const speak = () => {
    if (!text) return;
    if (playing) {
      window.speechSynthesis.cancel();
      onPause?.();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
    utter.onend = () => onPause?.();
    window.speechSynthesis.speak(utter);
    onPlay?.();
  };

  useEffect(() => {
    if (!playing || !text) return;
    const handleBeforeUnload = () => window.speechSynthesis.cancel();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.speechSynthesis.cancel();
    };
  }, [text, playing]);

  if (!text) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-strong" style={{ height: 80 }}>
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={speak}
          disabled={!text}
          className="flex-shrink-0 flex items-center justify-center rounded-full transition-all"
          style={{
            width: 56,
            height: 56,
            background: playing ? 'var(--crimson)' : 'var(--cyan)',
            color: 'var(--bg-main)',
            opacity: text ? 1 : 0.5,
            cursor: text ? 'pointer' : 'not-allowed',
          }}
          aria-label={playing ? t('audio.pauseAlert') : t('audio.playAlert')}
        >
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ms-0.5" />}
        </button>

        {/* Equalizer Animation */}
        <AnimatePresence>
          {playing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-shrink-0 flex items-center gap-1"
            >
              <Volume2 className="w-5 h-5 text-[var(--cyan)]" />
              <div className="flex items-end gap-0.5" style={{ height: 24 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full"
                    style={{ background: 'var(--cyan)' }}
                    animate={{ height: [4, 16 + i * 2, 4] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Label */}
        <div className="flex-1 min-w-0 ms-2">
          <p className="text-lg font-bold text-[var(--text-primary)] truncate">
            {label || t('audio.voiceAlert')}
          </p>
          <p className="text-sm text-[var(--text-muted)] truncate">
            {playing ? t('audio.playing') : t('audio.tapToPlay')}
          </p>
        </div>
      </div>
    </div>
  );
}
