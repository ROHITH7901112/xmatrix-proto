'use client';

import { motion } from 'framer-motion';

interface StrategyRingProps {
  done: number;
  total: number;
  pct: number;
}

export function StrategyRing({ done, total, pct }: StrategyRingProps) {
  const radius = 78;
  const strokeWidth = 13;
  const gradientId = 'ring-gradient';

  const ringColor =
    pct >= 70 ? ['#3b82f6', '#10b981'] :
    pct >= 40 ? ['#f59e0b', '#3b82f6'] :
                ['#ef4444', '#f59e0b'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Strategy Achievement</p>

      <div className="relative w-52 h-52">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={ringColor[0]} />
              <stop offset="100%" stopColor={ringColor[1]} />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />

          {/* Progress arc */}
          <motion.circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: total === 0 ? 0 : pct / 100 }}
            transition={{ duration: 1.8, ease: [0.34, 1.26, 0.64, 1] }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <motion.span
            className="text-4xl font-bold text-white tabular-nums"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {pct}%
          </motion.span>
          <span className="text-xs text-slate-400 font-medium">Achieved</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        {total === 0 ? (
          <p className="text-sm text-slate-500">No KPIs configured yet</p>
        ) : (
          <>
            <p className="text-lg font-semibold text-white">
              {done} <span className="text-slate-400 font-normal">of</span> {total}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">KPIs on target</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
