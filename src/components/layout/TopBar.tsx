'use client';

import { useXMatrixStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Moon,
  Sun,
  Share2,
  Download,
  Eye,
  Calendar,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface TopBarProps {
  title?: string;
  showRotation?: boolean;
  showZoom?: boolean;
}

export function TopBar({ title, showRotation = false, showZoom = false }: TopBarProps) {
  const {
    data,
    viewState,
    toggleDarkMode,
    setTimeHorizon,
    rotateClockwise,
    setZoom,
  } = useXMatrixStore();

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
      {/* Left Section - Strategy Info */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-base font-semibold text-white">
            {title || data.name}
          </h1>
          <span className="text-xs text-slate-500">
            {data.periodStart}–{data.periodEnd} Strategy Period
          </span>
        </div>
      </div>

      {/* Center Section - Controls */}
      <div className="flex items-center gap-2">
        {/* Time Horizon Selector */}
        <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5">
          <button
            onClick={() => setTimeHorizon('current')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewState.timeHorizon === 'current'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Current
          </button>
          <button
            onClick={() => setTimeHorizon('future')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewState.timeHorizon === 'future'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Future
          </button>
        </div>

        {/* Rotation Control */}
        {showRotation && (
          <button
            onClick={rotateClockwise}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xs font-medium"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Rotate
          </button>
        )}

        {/* Zoom Controls */}
        {showZoom && (
          <div className="flex items-center bg-slate-800/50 rounded-lg">
            <button
              onClick={() => setZoom(Math.max(0.5, viewState.zoom - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs text-slate-400 min-w-[50px] text-center">
              {Math.round(viewState.zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, viewState.zoom + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-medium">
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
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
