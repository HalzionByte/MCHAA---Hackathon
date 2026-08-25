"use client";
import { motion } from 'framer-motion';

export default function ConfidenceRing({ value, size = 64, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  const color = value > 0.7 ? 'var(--crimson)' : value > 0.3 ? 'var(--amber)' : 'var(--emerald)';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--card-border)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
        />
      </svg>
      <span className="absolute text-center">
        <span className="text-lg font-bold">{Math.round(value * 100)}%</span>
        <span className="block text-xs text-muted">Confidence</span>
      </span>
    </div>
  );
}