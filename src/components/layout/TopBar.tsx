'use client';

import { useXMatrixStore } from '@/lib/store';
import { useTheme } from '@/components/providers/ThemeProvider';
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

  const { theme, colors, toggleTheme } = useTheme();
  const activeData = getActiveData();

  return (
    <header className={cn('flex items-center justify-between h-14 px-6 backdrop-blur-sm border-b', colors.topbar)}>
      {/* Left Section - Strategy Info */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className={cn('text-base font-semibold', colors.text.primary)}>
            {title || activeData.name}
          </h1>
          <span className={cn('text-xs', colors.text.tertiary)}>
            {activeData.periodStart}–{activeData.periodEnd} Strategy Period
          </span>
        </div>
      </div>

      {/* Center Section - Controls */}
      <div className="flex items-center gap-2">
      </div>
      <div className="flex items-center gap-2">
        {/* View/Edit Mode Toggle */}
        <EditModeToggle />

        <div className={cn('w-px h-6 mx-1', colors.border.light)} />

        <button className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium', colors.text.secondary, 'hover:' + colors.text.primary, 'hover:' + colors.bg.tertiary)}>
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
        <button className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium', colors.text.secondary, 'hover:' + colors.text.primary, 'hover:' + colors.bg.tertiary)}>
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <div className={cn('w-px h-6 mx-1', colors.border.light)} />
        <button
          onClick={toggleTheme}
          className={cn('p-2 rounded-lg transition-all', colors.text.secondary, 'hover:' + colors.text.primary, 'hover:' + colors.bg.tertiary)}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
