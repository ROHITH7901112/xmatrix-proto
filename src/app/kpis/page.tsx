'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useXMatrixStore } from '@/lib/store';
import { getHealthClass, getTrendIcon, getTrendColor, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPIsPage() {
  const { data, setHoveredElement, setSelectedElement } = useXMatrixStore();

  return (
    <DashboardLayout title="KPIs / Metrics">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.kpis.map((kpi, index) => {
            const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
            const progress = (kpi.currentValue / kpi.targetValue) * 100;
            const owners = data.owners.filter(o => kpi.ownerIds.includes(o.id));

            return (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredElement({ id: kpi.id, type: 'kpi' })}
                onMouseLeave={() => setHoveredElement(null)}
                onClick={() => setSelectedElement({ id: kpi.id, type: 'kpi' })}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500">{kpi.code}</span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">{kpi.title}</h3>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full border capitalize',
                    getHealthClass(kpi.health)
                  )}>
                    {kpi.health.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {kpi.currentValue}
                      <span className="text-sm text-slate-500 ml-1">{kpi.unit}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Target: {kpi.targetValue} {kpi.unit}
                    </div>
                  </div>
                  <div className={cn('flex items-center gap-1', getTrendColor(kpi.trend))}>
                    <TrendIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      kpi.health === 'on-track' ? 'bg-emerald-500' :
                      kpi.health === 'at-risk' ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                {/* Owners */}
                <div className="flex items-center gap-1">
                  {owners.slice(0, 3).map(owner => (
                    <div
                      key={owner.id}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs font-medium"
                      title={owner.name}
                    >
                      {owner.initials}
                    </div>
                  ))}
                  {owners.length > 3 && (
                    <span className="text-xs text-slate-500">+{owners.length - 3}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
