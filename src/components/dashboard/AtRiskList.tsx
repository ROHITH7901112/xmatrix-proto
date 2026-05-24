'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { HealthStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AtRiskItem {
  id: string;
  title: string;
  health: HealthStatus;
  tier: 'LTO' | 'AO' | 'Initiative' | 'KPI';
}

const TIER_COLORS: Record<AtRiskItem['tier'], string> = {
  LTO:        'bg-purple-500/15 text-purple-300 border-purple-500/25',
  AO:         'bg-blue-500/15 text-blue-300 border-blue-500/25',
  Initiative: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  KPI:        'bg-slate-500/15 text-slate-300 border-slate-500/25',
};

const TIER_ORDER: AtRiskItem['tier'][] = ['LTO', 'AO', 'Initiative', 'KPI'];

interface AtRiskListProps {
  items: AtRiskItem[];
}

export function AtRiskList({ items }: AtRiskListProps) {
  const sorted = [...items].sort((a, b) => {
    if (a.health === 'off-track' && b.health !== 'off-track') return -1;
    if (b.health === 'off-track' && a.health !== 'off-track') return 1;
    return TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
  });

  const shown = sorted.slice(0, 10);
  const overflow = sorted.length - shown.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Escalation Radar</h3>
            <p className="text-xs text-slate-500">Entities needing attention</p>
          </div>
        </div>
        {items.length > 0 && (
          <span className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
            items.some(i => i.health === 'off-track')
              ? 'bg-red-500/20 text-red-300'
              : 'bg-amber-500/20 text-amber-300',
          )}>
            {items.length}
          </span>
        )}
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-8 gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-400">All systems on track</p>
            <p className="text-xs text-slate-500 mt-0.5">No entities need attention right now</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          {shown.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              whileHover={{ x: 3, transition: { duration: 0.12 } }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 cursor-default group"
            >
              {item.health === 'off-track' ? (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}

              <span
                className={cn(
                  'flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide',
                  TIER_COLORS[item.tier],
                )}
              >
                {item.tier}
              </span>

              <span className="text-sm text-slate-300 truncate flex-1 group-hover:text-white transition-colors">
                {item.title}
              </span>

              <span className={cn(
                'flex-shrink-0 text-[10px] font-semibold',
                item.health === 'off-track' ? 'text-red-400' : 'text-amber-400',
              )}>
                {item.health === 'off-track' ? 'Off Track' : 'At Risk'}
              </span>
            </motion.div>
          ))}

          {overflow > 0 && (
            <p className="text-xs text-slate-500 text-center pt-1">
              +{overflow} more item{overflow !== 1 ? 's' : ''} not shown
            </p>
          )}
        </div>
      )}
    </div>
  );
}
