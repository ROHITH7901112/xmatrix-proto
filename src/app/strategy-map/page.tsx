'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useXMatrixStore } from '@/lib/store';
import { Map } from 'lucide-react';

export default function StrategyMapPage() {
  const { data } = useXMatrixStore();

  return (
    <DashboardLayout title="Strategy Map">
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6">
          <Map className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Strategy Map</h2>
        <p className="text-slate-400 max-w-md mb-8">
          Visualize the strategic linkages between objectives, initiatives, and outcomes in a hierarchical strategy map.
        </p>
        <div className="grid grid-cols-4 gap-4 max-w-3xl w-full">
          {['Financial', 'Customer', 'Process', 'Learning'].map((perspective) => (
            <div
              key={perspective}
              className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center"
            >
              <h3 className="text-sm font-semibold text-white mb-2">{perspective}</h3>
              <p className="text-xs text-slate-500">Perspective</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-8">
          Full strategy map visualization coming in next release.
        </p>
      </div>
    </DashboardLayout>
  );
}
