'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useXMatrixStore } from '@/lib/store';
import { isKpiDone } from '@/lib/status-cascade';
import { StrategyRing } from '@/components/dashboard/StrategyRing';
import { HealthCards } from '@/components/dashboard/HealthCards';
import { AtRiskList } from '@/components/dashboard/AtRiskList';
import { QuickWins } from '@/components/dashboard/QuickWins';
import { HealthStatus } from '@/lib/types';

export default function DashboardPage() {
  const data = useXMatrixStore((s) => s.data);
  const isLoading = useXMatrixStore((s) => s.isLoading);

  const stats = useMemo(() => {
    if (!data) return null;

    const done = data.kpis.filter(isKpiDone).length;
    const total = data.kpis.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const atRiskItems = [
      ...data.longTermObjectives
        .filter(e => e.health !== 'on-track')
        .map(e => ({ id: e.id, title: e.title, health: e.health as HealthStatus, tier: 'LTO' as const })),
      ...data.annualObjectives
        .filter(e => e.health !== 'on-track')
        .map(e => ({ id: e.id, title: e.title, health: e.health as HealthStatus, tier: 'AO' as const })),
      ...data.initiatives
        .filter(e => e.health !== 'on-track')
        .map(e => ({ id: e.id, title: e.title, health: e.health as HealthStatus, tier: 'Initiative' as const })),
      ...data.kpis
        .filter(e => e.health !== 'on-track')
        .map(e => ({ id: e.id, title: e.title, health: e.health as HealthStatus, tier: 'KPI' as const })),
    ];

    return { done, total, pct, atRiskItems };
  }, [data]);

  if (isLoading || !data || !stats) {
    return (
      <DashboardLayout title="Executive Dashboard">
        <div className="p-6 grid grid-cols-4 gap-6 animate-pulse">
          <div className="col-span-1 bg-slate-800/60 rounded-2xl h-72" />
          <div className="col-span-3 grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-800/60 rounded-2xl h-32" />
            ))}
          </div>
          <div className="col-span-2 bg-slate-800/60 rounded-2xl h-80" />
          <div className="col-span-2 bg-slate-800/60 rounded-2xl h-80" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Executive Dashboard">
      <div className="p-6 max-w-7xl mx-auto">

        {/* Row 1: Strategy Ring + Health Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="col-span-1">
            <StrategyRing
              done={stats.done}
              total={stats.total}
              pct={stats.pct}
            />
          </div>
          <div className="col-span-3">
            <HealthCards
              ltos={data.longTermObjectives}
              aos={data.annualObjectives}
              initiatives={data.initiatives}
              kpis={data.kpis}
            />
          </div>
        </div>

        {/* Row 2: At-Risk List + Quick Wins */}
        <div className="grid grid-cols-2 gap-6">
          <AtRiskList items={stats.atRiskItems} />
          <QuickWins kpis={data.kpis} />
        </div>
      </div>
    </DashboardLayout>
  );
}
