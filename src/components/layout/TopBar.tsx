'use client';

import { useXMatrixStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Moon,
  Sun,
  Share2,
  Download,
  Calendar,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { EditModeToggle } from '@/components/shared/EditModeToggle';

interface TopBarProps {
  title?: string;
  showRotation?: boolean;
  showZoom?: boolean;
}

export function TopBar({ title, showRotation = false, showZoom = false }: TopBarProps) {
  const {
    viewState,
    toggleDarkMode,
    setTimeHorizon,
    rotateClockwise,
    setZoom,
    getActiveData,
  } = useXMatrixStore();

  const activeData = getActiveData();

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
      {/* Left Section - Strategy Info */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-base font-semibold text-white">
            {title || activeData.name}
          </h1>
          <span className="text-xs text-slate-500">
            {activeData.periodStart}–{activeData.periodEnd} Strategy Period
          </span>
        </div>
      </div>

      {/* Center Section - Controls - REMOVED */}
      <div className="flex items-center gap-2">
      </div>
      <div className="flex items-center gap-2">
        {/* View/Edit Mode Toggle */}
        <EditModeToggle />

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-medium">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-medium">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          {viewState.isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
