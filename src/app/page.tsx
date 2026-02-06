'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { XMatrix } from '@/components/x-matrix/XMatrix';
import { DetailPanel } from '@/components/shared/DetailPanel';
import { Legend } from '@/components/x-matrix/Legend';

export default function XMatrixPage() {
  return (
    <DashboardLayout showRotation showZoom>
      <div className="flex flex-col h-full bg-slate-950">
        {/* Main Matrix Area - Scrollable */}
        <div className="flex-1 overflow-hidden relative">
          <XMatrix />
        </div>

        {/* Fixed Footer Legend - Non-overlapping */}
        <div className="flex-none">
          <Legend />
        </div>

        <DetailPanel />
      </div>
    </DashboardLayout>
  );
}
