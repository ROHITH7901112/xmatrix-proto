'use client';

import { motion } from 'framer-motion';
import { Rocket, Trophy } from 'lucide-react';
import { KPI } from '@/lib/types';
import { isKpiDone } from '@/lib/status-cascade';
import { isLowerBetter } from '@/lib/kpi-calculations';
import { cn } from '@/lib/utils';

interface QuickWinKPI extends KPI {
  pct: number;
}

function getQuickWins(kpis: KPI[]): QuickWinKPI[] {
  return kpis
    .filter(kpi => {
      if (isKpiDone(kpi)) return false;
      if (!kpi.targetValue || kpi.targetValue === 0) return false;
      const lower = isLowerBetter(kpi.unit, kpi.code);
      const pct = lower
        ? kpi.targetValue / Math.max(kpi.currentValue, 0.001)
        : kpi.currentValue / kpi.targetValue;
      return pct >= 0.8 && pct < 1.0;
    })
    .map(kpi => {
      const lower = isLowerBetter(kpi.unit, kpi.code);
      const pct = lower
        ? kpi.targetValue / Math.max(kpi.currentValue, 0.001)
        : kpi.currentValue / kpi.targetValue;
      return { ...kpi, pct };
    })
    .sort((a, b) => b.pct - a.pct);
}

interface QuickWinsProps {
  kpis: KPI[];
}

export function QuickWins({ kpis }: QuickWinsProps) {
  const wins = getQuickWins(kpis);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Rocket className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Quick Wins</h3>
          <p className="text-xs text-slate-500">KPIs ≥ 80% to target</p>
        </div>
        {wins.length > 0 && (
          <span className="ml-auto flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
            {wins.length}
          </span>
        )}
      </div>

      {/* Cards */}
      {wins.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-8 gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-slate-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">No KPIs in the 80–99% range</p>
            <p className="text-xs text-slate-500 mt-0.5">Keep pushing — wins are on the way</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          {wins.map((kpi, i) => (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-200 font-medium line-clamp-2 flex-1 leading-snug">
                  {kpi.title}
                </p>
                <span className={cn(
                  'flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full',
                  kpi.pct >= 0.95
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-teal-500/15 text-teal-400',
                )}>
                  {Math.round(kpi.pct * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(kpi.pct * 100, 100)}%` }}
                    transition={{ delay: i * 0.07 + 0.2, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0 tabular-nums">
                  {kpi.currentValue} / {kpi.targetValue} {kpi.unit}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
