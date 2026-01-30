'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useXMatrixStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TeamsPage() {
  const { data, setHoveredElement, setSelectedElement } = useXMatrixStore();

  const getResponsibilityColor = (type: string) => {
    switch (type) {
      case 'accountable': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'responsible': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'consulted': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'informed': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <DashboardLayout title="Owners / Teams">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.owners.map((owner, index) => {
            // Find KPIs this owner is responsible for
            const ownedKpis = data.kpis.filter(k => k.ownerIds.includes(owner.id));

            return (
              <motion.div
                key={owner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredElement({ id: owner.id, type: 'owner' })}
                onMouseLeave={() => setHoveredElement(null)}
                onClick={() => setSelectedElement({ id: owner.id, type: 'owner' })}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-lg font-semibold">
                    {owner.initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{owner.name}</h3>
                    <p className="text-xs text-slate-500">{owner.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full border capitalize',
                    getResponsibilityColor(owner.responsibilityType)
                  )}>
                    {owner.responsibilityType}
                  </span>
                  <span className="text-xs text-slate-500">
                    {ownedKpis.length} KPIs
                  </span>
                </div>

                {ownedKpis.length > 0 && (
                  <div className="space-y-1">
                    {ownedKpis.slice(0, 3).map(kpi => (
                      <div
                        key={kpi.id}
                        className="flex items-center justify-between text-xs p-2 bg-slate-800/50 rounded"
                      >
                        <span className="text-slate-400">{kpi.code}</span>
                        <span className="text-slate-500 truncate ml-2">{kpi.title}</span>
                      </div>
                    ))}
                    {ownedKpis.length > 3 && (
                      <p className="text-xs text-slate-600 text-center pt-1">
                        +{ownedKpis.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
