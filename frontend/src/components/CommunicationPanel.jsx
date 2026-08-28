"use client";
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Radio, Play, Pause, Smartphone, Volume2 } from 'lucide-react';

export default function CommunicationPanel({ voiceAudioUrl, smsText }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setAudioError(true));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-5"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--card-border)]">
        <Radio className="w-4 h-4 text-[var(--cyan)]" />
        Communication
      </h3>

      {/* Voice Guide Section */}
      <div className="mb-5">
        <p className="text-xs text-[var(--text-muted)] mb-2.5">Voice Guide for Farmers</p>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={audioError}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: isPlaying ? 'var(--crimson)' : 'var(--cyan)',
              color: 'var(--bg-main)',
              opacity: audioError ? 0.5 : 1,
            }}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause Guide
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play Voice Guide
              </>
            )}
          </button>
          {isPlaying && (
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[var(--cyan)]" />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-[var(--cyan)] rounded-full"
                    animate={{ height: [4, 12, 4] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {audioError && (
          <p className="text-xs text-[var(--amber)] mt-2">Audio unavailable for preview</p>
        )}
        <audio
          ref={audioRef}
          src={voiceAudioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* SMS Preview Section */}
      <div>
        <p className="text-xs text-[var(--text-muted)] mb-2.5">SMS Alert Preview</p>
        <div className="rounded-xl bg-[var(--bg-main)] p-4 border border-[var(--card-border)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--emerald)]/15 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-[var(--emerald)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[var(--text-muted)] mb-1">Crop Health Agent</p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{smsText}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--card-border)]">
                <p className="text-[10px] text-[var(--text-muted)]">{smsText?.length || 0}/160 characters</p>
                <span className="text-[10px] text-[var(--emerald)] font-medium">Low-bandwidth ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
