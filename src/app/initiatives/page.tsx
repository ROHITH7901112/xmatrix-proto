'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useXMatrixStore } from '@/lib/store';
import { getHealthClass, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Rocket, Calendar, ArrowRight } from 'lucide-react';

export default function InitiativesPage() {
  const { data, setHoveredElement, setSelectedElement } = useXMatrixStore();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <DashboardLayout title="Key Initiatives">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.initiatives.map((init, index) => {
            // Find related KPIs
            const relatedKpis = data.relationships
              .filter(r => r.sourceId === init.id && r.targetType === 'kpi')
              .map(r => data.kpis.find(k => k.id === r.targetId))
              .filter(Boolean);

            return (
              <motion.div
                key={init.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredElement({ id: init.id, type: 'initiative' })}
                onMouseLeave={() => setHoveredElement(null)}
                onClick={() => setSelectedElement({ id: init.id, type: 'initiative' })}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800">
                      <Rocket className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500">{init.code}</span>
                      <h3 className="text-sm font-semibold text-white">{init.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full border capitalize',
                      getPriorityColor(init.priority)
                    )}>
                      {init.priority}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full border capitalize',
                      getHealthClass(init.health)
                    )}>
                      {init.health.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-4">{init.description}</p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{init.startDate}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{init.endDate}</span>
                  </div>
                  {relatedKpis.length > 0 && (
                    <span className="text-slate-400">
                      {relatedKpis.length} linked KPIs
                    </span>
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
