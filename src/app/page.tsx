'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { XMatrix } from '@/components/x-matrix/XMatrix';
import { DetailPanel } from '@/components/shared/DetailPanel';
import { Legend } from '@/components/x-matrix/Legend';

export default function XMatrixPage() {
  return (
    <DashboardLayout showRotation showZoom>
      <div className="relative h-full">
        <XMatrix />
        <Legend />
        <DetailPanel />
      </div>
    </DashboardLayout>
  );
}
