'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MessageSquare } from 'lucide-react';

export default function ReviewsPage() {
  return (
    <DashboardLayout title="Reviews / Catchball">
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6">
          <MessageSquare className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Reviews & Catchball</h2>
        <p className="text-slate-400 max-w-md mb-8">
          Conduct strategy reviews and facilitate the catchball process to align objectives across organizational levels.
        </p>
        <div className="flex items-center gap-4">
          <div className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-xs text-slate-500">Pending Reviews</div>
          </div>
          <div className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-xs text-slate-500">Open Discussions</div>
          </div>
          <div className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-xs text-slate-500">Action Items</div>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-8">
          Full review and catchball functionality coming in next release.
        </p>
      </div>
    </DashboardLayout>
  );
}
