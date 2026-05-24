'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, BarChart3, LucideIcon } from 'lucide-react';
import { HealthStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HealthCardProps {
  tier: string;
  icon: LucideIcon;
  items: { health: HealthStatus }[];
  delay?: number;
}

function HealthCard({ tier, icon: Icon, items, delay = 0 }: HealthCardProps) {
  const counts = items.reduce(
    (acc, i) => { acc[i.health]++; return acc; },
    { 'on-track': 0, 'at-risk': 0, 'off-track': 0 } as Record<HealthStatus, number>,
  );
  const total = items.length;

  const pills: { label: string; health: HealthStatus; color: string; bg: string }[] = [
    { label: 'On Track',  health: 'on-track',  color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25' },
    { label: 'At Risk',   health: 'at-risk',   color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/25' },
    { label: 'Off Track', health: 'off-track', color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/25' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-sm font-semibold text-white">{tier}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">{total} total</span>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-1.5">
        {pills.map(({ label, health, color, bg }) => (
          <div
            key={health}
            className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold', bg)}
          >
            <span className={cn('text-base leading-none', color)}>
              {counts[health]}
            </span>
            <span className={color}>{label}</span>
          </div>
        ))}
      </div>

      {/* Mini stacked bar */}
      {total > 0 ? (
        <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
          {counts['on-track'] > 0 && (
            <motion.div
              className="bg-emerald-500 rounded-full"
              initial={{ flex: 0 }}
              animate={{ flex: counts['on-track'] }}
              transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
            />
          )}
          {counts['at-risk'] > 0 && (
            <motion.div
              className="bg-amber-500 rounded-full"
              initial={{ flex: 0 }}
              animate={{ flex: counts['at-risk'] }}
              transition={{ delay: delay + 0.3, duration: 0.6, ease: 'easeOut' }}
            />
          )}
          {counts['off-track'] > 0 && (
            <motion.div
              className="bg-red-500 rounded-full"
              initial={{ flex: 0 }}
              animate={{ flex: counts['off-track'] }}
              transition={{ delay: delay + 0.4, duration: 0.6, ease: 'easeOut' }}
            />
          )}
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-slate-800" />
      )}
    </motion.div>
  );
}

interface HealthCardsProps {
  ltos: { health: HealthStatus }[];
  aos: { health: HealthStatus }[];
  initiatives: { health: HealthStatus }[];
  kpis: { health: HealthStatus }[];
}

export function HealthCards({ ltos, aos, initiatives, kpis }: HealthCardsProps) {
  const cards = [
    { tier: 'Long-Term Objectives', icon: TrendingUp, items: ltos },
    { tier: 'Annual Objectives',    icon: Target,     items: aos },
    { tier: 'Initiatives',          icon: Zap,        items: initiatives },
    { tier: 'KPIs',                 icon: BarChart3,  items: kpis },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card, i) => (
        <HealthCard key={card.tier} {...card} delay={i * 0.08} />
      ))}
    </div>
  );
}
