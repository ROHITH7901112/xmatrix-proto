'use client';

import { useXMatrixStore } from '@/lib/store';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Moon,
  Sun,
  Share2,
  Download,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { EditModeToggle } from '@/components/shared/EditModeToggle';

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;
const DEFAULT_ZOOM = 0.75;

interface TopBarProps {
  title?: string;
  showRotation?: boolean;
  showZoom?: boolean;
}

export function TopBar({ title, showRotation = false, showZoom = false }: TopBarProps) {
  const {
    viewState,
    setZoom,
    getActiveData,
  } = useXMatrixStore();

  const { theme, colors, toggleTheme } = useTheme();
  const activeData = getActiveData();
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputValue, setInputValue] = useState(String(Math.round(viewState.zoom * 100)));

  const handleInputSubmit = () => {
    const value = parseInt(inputValue, 10);
    if (!isNaN(value)) {
      const zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value / 100));
      setZoom(zoomLevel);
    }
    setIsInputMode(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setIsInputMode(false);
    }
  };

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

        {showZoom && (
          <div className={cn('flex items-center rounded-lg border px-1.5 py-1 gap-1', colors.border.light, colors.bg.secondary)}>
            <button
              onClick={() => setZoom(Math.max(MIN_ZOOM, Number((viewState.zoom - ZOOM_STEP).toFixed(2))))}
              className={cn('p-1 rounded-md transition-all', colors.text.secondary, 'hover:' + colors.text.primary, 'hover:' + colors.bg.tertiary)}
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {isInputMode ? (
              <input
                type="number"
                min={Math.round(MIN_ZOOM * 100)}
                max={Math.round(MAX_ZOOM * 100)}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleInputSubmit}
                onKeyDown={handleInputKeyDown}
                className={cn('w-12 px-1 py-0.5 text-xs font-semibold rounded-md text-center outline-none', colors.bg.secondary, colors.text.primary, 'border', colors.border.light)}
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  setIsInputMode(true);
                  setInputValue(String(Math.round(viewState.zoom * 100)));
                }}
                className={cn('px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer', colors.text.secondary, 'hover:' + colors.text.primary, 'hover:' + colors.bg.tertiary)}
                title="Click to enter custom zoom percentage"
              >
                {Math.round(viewState.zoom * 100)}%
              </button>
            )}
            <button
              onClick={() => setZoom(Math.min(MAX_ZOOM, Number((viewState.zoom + ZOOM_STEP).toFixed(2))))}
              className={cn('p-1 rounded-md transition-all', colors.text.secondary, 'hover:' + colors.text.primary, 'hover:' + colors.bg.tertiary)}
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
