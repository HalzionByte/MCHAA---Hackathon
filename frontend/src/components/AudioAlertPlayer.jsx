"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2 } from 'lucide-react';
import { getAnomalyVoice } from '../api/api';

export default function AudioAlertPlayer({ anomalyId }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!anomalyId) return;
    let cancelled = false;

    async function fetchVoice() {
      setLoading(true);
      try {
        const data = await getAnomalyVoice(anomalyId);
        if (!cancelled && data?.audio_url) {
          setAudioUrl(data.audio_url);
        }
      } catch {
        if (!cancelled) setAudioError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVoice();
    return () => { cancelled = true; };
  }, [anomalyId]);

  const togglePlay = () => {
    if (!audioRef.current || audioError) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setAudioError(true));
    }
    setIsPlaying(!isPlaying);
  };

  if (!anomalyId) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-strong" style={{ height: 80 }}>
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center gap-4">
        {/* Status Dot */}
        <div className="flex-shrink-0">
          <span
            className="block w-4 h-4 rounded-full"
            style={{
              background: 'var(--crimson)',
              boxShadow: '0 0 8px var(--crimson)',
              animation: 'pulse-traffic-red 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={audioError || loading}
          className="flex-shrink-0 flex items-center justify-center rounded-full transition-all"
          style={{
            width: 56,
            height: 56,
            background: audioError ? 'var(--card-border)' : isPlaying ? 'var(--crimson)' : 'var(--cyan)',
            color: 'var(--bg-main)',
            opacity: audioError ? 0.5 : 1,
            cursor: audioError ? 'not-allowed' : 'pointer',
          }}
          aria-label={isPlaying ? 'Pause audio alert' : 'Play audio alert'}
        >
          {loading ? (
            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
          ) : isPlaying ? (
            <Pause className="w-7 h-7" />
          ) : (
            <Play className="w-7 h-7 ml-0.5" />
          )}
        </button>

        {/* Equalizer Animation */}
        <AnimatePresence>
          {isPlaying && (
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

        {/* Zone Label */}
        <div className="flex-1 min-w-0 ml-2">
          <p className="text-lg font-bold text-[var(--text-primary)] truncate">
            {audioError ? 'Audio unavailable' : 'Voice Alert'}
          </p>
          <p className="text-sm text-[var(--text-muted)] truncate">
            {isPlaying ? 'Playing now...' : 'Tap play to listen'}
          </p>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
}
