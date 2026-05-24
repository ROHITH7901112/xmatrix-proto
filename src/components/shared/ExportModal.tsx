'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileSpreadsheet, FileJson, Loader2, Download,
  BarChart3, Target, Zap, Users, TrendingUp, Link2, CalendarDays, LayoutList,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useXMatrixStore } from '@/lib/store';
import { exportToExcel, exportToJSON, ExportOptions, DEFAULT_EXPORT_OPTIONS } from '@/lib/excel-export';
import { cn } from '@/lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormatType = 'excel' | 'json';

interface SheetOption {
  key: keyof ExportOptions;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

const SHEET_OPTIONS: SheetOption[] = [
  {
    key: 'overview',
    label: 'Strategy Overview',
    description: 'Matrix summary, entity counts, health breakdown',
    icon: LayoutList,
  },
  {
    key: 'alignment',
    label: 'Strategy Alignment Map',
    description: 'Full LTO → AO → Initiative → KPI chain per row',
    icon: Link2,
    badge: 'CEO View',
  },
  {
    key: 'objectives',
    label: 'Long-Term & Annual Objectives',
    description: 'All LTOs and AOs with health status',
    icon: TrendingUp,
  },
  {
    key: 'initiatives',
    label: 'Initiatives',
    description: 'All initiatives with dates, priority and health',
    icon: Zap,
  },
  {
    key: 'kpis',
    label: 'KPIs & Performance',
    description: 'All KPIs with current vs target achievement',
    icon: BarChart3,
  },
  {
    key: 'monthlyData',
    label: 'Monthly Bowling Chart Data',
    description: 'Month-by-month target, actual and variance',
    icon: CalendarDays,
  },
  {
    key: 'owners',
    label: 'Owners',
    description: 'Owner list with roles and responsibility types',
    icon: Users,
  },
];

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { colors } = useTheme();
  const data = useXMatrixStore((s) => s.data);
  const [format, setFormat] = useState<FormatType>('excel');
  const [options, setOptions] = useState<ExportOptions>({ ...DEFAULT_EXPORT_OPTIONS });
  const [isExporting, setIsExporting] = useState(false);

  const selectedCount = Object.values(options).filter(Boolean).length;

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownload = async () => {
    if (!data) return;
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 80));

    try {
      const blob = format === 'excel'
        ? exportToExcel(data, options)
        : exportToJSON(data);

      const ext = format === 'excel' ? 'xlsx' : 'json';
      const fileName = `${data.name || 'strategy'}-xmatrix-${new Date().toISOString().split('T')[0]}.${ext}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn('fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm', colors.bg.overlay)}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col',
              'bg-slate-900 border-slate-700/60',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Export Strategy Data</h2>
                  <p className="text-xs text-slate-400">{data?.name ?? 'X-Matrix'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format selector */}
            <div className="px-6 pt-5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">Format</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('excel')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex-1 justify-center',
                    format === 'excel'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white',
                  )}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => setFormat('json')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex-1 justify-center',
                    format === 'json'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white',
                  )}
                >
                  <FileJson className="w-4 h-4" />
                  JSON
                </button>
              </div>
            </div>

            {/* Sheet options — only for Excel */}
            <AnimatePresence mode="wait">
              {format === 'excel' && (
                <motion.div
                  key="excel-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pt-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
                      Include in export
                    </p>
                    <div className="space-y-1.5">
                      {SHEET_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const checked = options[opt.key];
                        return (
                          <button
                            key={opt.key}
                            onClick={() => toggleOption(opt.key)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                              checked
                                ? 'bg-slate-800 border-slate-600/80'
                                : 'bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-700/50',
                            )}
                          >
                            <div className={cn(
                              'w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors',
                              checked
                                ? 'bg-blue-600 border-blue-500'
                                : 'border-slate-600',
                            )}>
                              {checked && (
                                <motion.svg
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2.5 h-2.5 text-white"
                                  viewBox="0 0 10 10"
                                  fill="none"
                                >
                                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </motion.svg>
                              )}
                            </div>
                            <Icon className={cn('w-4 h-4 flex-shrink-0', checked ? 'text-blue-400' : 'text-slate-500')} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn('text-sm font-medium', checked ? 'text-white' : 'text-slate-400')}>
                                  {opt.label}
                                </span>
                                {opt.badge && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{opt.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
              {format === 'json' && (
                <motion.div
                  key="json-info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 pt-4"
                >
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <FileJson className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-300 font-medium">Full data export</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Exports all strategy data as structured JSON — useful for backups and system integrations.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="px-6 py-4 mt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
              {format === 'excel' && (
                <p className="text-xs text-slate-500">
                  {selectedCount === 0
                    ? 'Select at least one sheet'
                    : `Will create ${selectedCount} sheet${selectedCount !== 1 ? 's' : ''}`}
                </p>
              )}
              {format === 'json' && <p className="text-xs text-slate-500">Single file export</p>}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isExporting || (format === 'excel' && selectedCount === 0) || !data}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                    'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25',
                    'hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/35',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                  )}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download {format === 'excel' ? 'Excel' : 'JSON'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
