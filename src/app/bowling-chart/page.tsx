'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BowlingChart } from '@/components/bowling-chart/BowlingChart';
import { DetailPanel } from '@/components/shared/DetailPanel';

export default function BowlingChartPage() {
  return (
    <DashboardLayout title="Bowling Chart / KPI Scorecard">
      <div className="relative h-full bg-slate-950">
        <BowlingChart />
        <DetailPanel />
      </div>
    </DashboardLayout>
  );
}
