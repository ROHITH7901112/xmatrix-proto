'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useXMatrixStore } from '@/lib/store';
import { cn, getHealthClass, getTrendColor, getStatusLabel } from '@/lib/utils';
import { KPI, HealthStatus, Owner, MonthlyKPIData } from '@/lib/types';
import {
  formatValue,
  formatVariance,
  computeVariance,
  computeVariancePercent,
  isLowerBetter,
} from '@/lib/kpi-calculations';
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Current month index (0-based). In production, derive from real date.
const CURRENT_MONTH_INDEX = new Date().getMonth(); // 0 = Jan
const CURRENT_YEAR = new Date().getFullYear();

// ============================================================================
// SORT TYPES
// ============================================================================
type SortField = 'code' | 'title' | 'health' | 'trend' | 'unit' | 'owner' | 'variance';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

// ============================================================================
// BOWLING CHART COLOR & INDICATOR SYSTEM
// ============================================================================
// 
// KPI HEALTH STATUS (Status Column):
// ——————————————————————————————————
// ● ON-TRACK (Green):   Variance % ≥ 0%        | Actual ≥ Target
// ◐ AT-RISK  (Yellow):  -5% ≤ Variance % < 0%  | Target at risk but salvageable
// ○ OFF-TRACK (Red):    Variance % < -5%       | Significantly below target
//
// NOTE: Health is evaluated on the CURRENT MONTH if it has data, otherwise falls back
//       to the most recent month with actual values. This prevents false red statuses
//       for KPIs that started mid-year but have good cumulative progress.
//
// TREND INDICATOR (Trend Column):
// ———————————————————————————————
// ↑ UP:      Performance improving | Recent average > Earlier average
// ↓ DOWN:    Performance declining | Recent average < Earlier average
// — STABLE:  Flat performance      | Change < 1% of target (noise threshold)
//
// For "lower is better" metrics (days, costs), the direction flips:
// Declining values (improvement) show UP trend.
//
// VARIANCE BAR (Below each month cell):
// —————————————————————————————————————
// Green bar (■):  Exceeds target      | Variance % ≥ 0%
// Yellow bar (■): At-risk threshold   | -5% ≤ Variance % < 0%
// Red bar (■):    Off-track threshold | Variance % < -5%
// Width:          50% + variance_percent, clamped 5-95% (always visible)
//
// RETROACTIVE PROGRESS DISTRIBUTION (On KPI Creation):
// ————————————————————————————————————————————————————
// When creating a KPI with current value > 0, the progress is split retroactively
// across all months from start date to current month, proportional to the target
// distribution (equal, linear, or front-loaded). This reflects work already done.
//
// Example: KPI created in March with 10% progress and equal distribution (Jan-Dec):
// - Jan: 5% actual (share of 10% progress)
// - Feb: 5% actual (share of 10% progress)
// - Mar onwards: 0% actual (future months, not yet started)
//
// ============================================================================

// ============================================================================
// MAIN BOWLING CHART
// ============================================================================
export function BowlingChart() {
  const { data, fetchData, setHoveredElement, setSelectedElement, updateMonthlyKpiData } = useXMatrixStore();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Always fetch fresh data when this page mounts — ensures newly created KPIs appear
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const [filters, setFilters] = useState({
    health: null as HealthStatus | null,
    owner: null as string | null,
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortState>({ field: null, direction: 'asc' });
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);

  const toggleRow = useCallback((id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Filtering
  const filteredKpis = useMemo(() => {
    return data.kpis.filter((kpi) => {
      if (filters.health && kpi.health !== filters.health) return false;
      if (filters.owner && !kpi.ownerIds.includes(filters.owner)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!kpi.title.toLowerCase().includes(q) && !kpi.code.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data.kpis, filters]);

  // Sorting
  const sortedKpis = useMemo(() => {
    if (!sort.field) return filteredKpis;

    const sorted = [...filteredKpis].sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'code':
          cmp = a.code.localeCompare(b.code);
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'health': {
          const order: Record<string, number> = { 'off-track': 0, 'at-risk': 1, 'on-track': 2 };
          cmp = (order[a.health] ?? 0) - (order[b.health] ?? 0);
          break;
        }
        case 'trend': {
          const order: Record<string, number> = { 'down': 0, 'stable': 1, 'up': 2 };
          cmp = (order[a.trend] ?? 0) - (order[b.trend] ?? 0);
          break;
        }
        case 'unit':
          cmp = a.unit.localeCompare(b.unit);
          break;
        case 'owner': {
          const aOwner = data.owners.find(o => a.ownerIds.includes(o.id))?.name || '';
          const bOwner = data.owners.find(o => b.ownerIds.includes(o.id))?.name || '';
          cmp = aOwner.localeCompare(bOwner);
          break;
        }
        case 'variance': {
          const aData = a.monthlyData.find(m => m.month === months[CURRENT_MONTH_INDEX]);
          const bData = b.monthlyData.find(m => m.month === months[CURRENT_MONTH_INDEX]);
          const aVar = aData?.variance ?? -Infinity;
          const bVar = bData?.variance ?? -Infinity;
          cmp = aVar - bVar;
          break;
        }
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [filteredKpis, sort, data.owners]);

  const getOwnersByIds = useCallback((ids: string[]): Owner[] => {
    return data.owners.filter((o) => ids.includes(o.id));
  }, [data.owners]);

  const clearFilters = () => {
    setFilters({ health: null, owner: null, search: '' });
  };

  const hasActiveFilters = filters.health || filters.owner || filters.search;

  const toggleSort = useCallback((field: SortField) => {
    setSort(prev => {
      if (prev.field === field) {
        if (prev.direction === 'asc') return { field, direction: 'desc' };
        return { field: null, direction: 'asc' }; // Third click clears
      }
      return { field, direction: 'asc' };
    });
  }, []);

  const SortIcon = useCallback(({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ArrowUpDown className="w-3 h-3 text-slate-600" />;
    return sort.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-400" />
      : <ArrowDown className="w-3 h-3 text-blue-400" />;
  }, [sort]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">KPI Scorecard</h2>
          <span className="px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-800 rounded">
            {sortedKpis.length} of {data.kpis.length} KPIs
          </span>
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Previous year"
            >
              ‹
            </button>
            <span className="px-3 py-1 text-sm font-medium text-white bg-slate-800 rounded-md min-w-[80px] text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Next year"
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search KPIs..."
              className="pl-9 pr-4 py-2 w-64 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
              showFilters || hasActiveFilters
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-800"
          >
            <div className="flex items-center gap-6 px-6 py-4 bg-slate-900/50">
              {/* Health Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
                <div className="flex items-center gap-1">
                  {(['on-track', 'at-risk', 'off-track'] as HealthStatus[]).map((health) => (
                    <button
                      key={health}
                      onClick={() => setFilters((f) => ({ ...f, health: f.health === health ? null : health }))}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                        filters.health === health
                          ? getHealthClass(health)
                          : 'text-slate-400 border-slate-700 hover:border-slate-600'
                      )}
                    >
                      {getStatusLabel(health)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Owner Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Owner</span>
                <select
                  value={filters.owner || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, owner: e.target.value || null }))}
                  className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Owners</option>
                  {data.owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-900">
            <tr className="border-b border-slate-800">
              <th
                className="sticky left-0 z-20 bg-slate-900 px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-64 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1">
                  KPI <SortIcon field="title" />
                </div>
              </th>
              <th
                className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-20 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('health')}
              >
                <div className="flex items-center justify-center gap-1">
                  Status <SortIcon field="health" />
                </div>
              </th>
              <th
                className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('trend')}
              >
                <div className="flex items-center justify-center gap-1">
                  Trend <SortIcon field="trend" />
                </div>
              </th>
              <th
                className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('unit')}
              >
                <div className="flex items-center justify-center gap-1">
                  Unit <SortIcon field="unit" />
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-40 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('owner')}
              >
                <div className="flex items-center gap-1">
                  Owner <SortIcon field="owner" />
                </div>
              </th>
              {months.map((month, idx) => (
                <th
                  key={month}
                  className={cn(
                    'px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider w-24',
                    idx === CURRENT_MONTH_INDEX
                      ? 'text-blue-400 bg-blue-500/5'
                      : 'text-slate-400'
                  )}
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sortedKpis.map((kpi, index) => (
              <MemoizedKPIRow
                key={kpi.id}
                kpi={kpi}
                owners={getOwnersByIds(kpi.ownerIds)}
                isExpanded={expandedRows.has(kpi.id)}
                onToggle={() => toggleRow(kpi.id)}
                onHover={(hover) => setHoveredElement(hover ? { id: kpi.id, type: 'kpi' } : null)}
                onClick={() => setSelectedElement({ id: kpi.id, type: 'kpi' })}
                onUpdateMonthly={updateMonthlyKpiData}
                index={index}
              />
            ))}
            {sortedKpis.length === 0 && (
              <tr>
                <td colSpan={5 + months.length} className="px-6 py-12 text-center text-slate-500">
                  No KPIs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// MEMOIZED KPI ROW
// ============================================================================
interface KPIRowProps {
  kpi: KPI;
  owners: Owner[];
  isExpanded: boolean;
  onToggle: () => void;
  onHover: (hover: boolean) => void;
  onClick: () => void;
  onUpdateMonthly: (kpiId: string, month: string, patch: { target?: number; actual?: number | null }) => Promise<void>;
  index: number;
}

const MemoizedKPIRow = React.memo(function KPIRow({
  kpi,
  owners,
  isExpanded,
  onToggle,
  onHover,
  onClick,
  onUpdateMonthly,
  index,
}: KPIRowProps) {
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const lowerBetter = isLowerBetter(kpi.unit, kpi.code);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onClick={onClick}
        className="group hover:bg-slate-800/30 cursor-pointer transition-colors"
      >
        {/* KPI Name */}
        <td className="sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900/95 px-4 py-3 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex items-center justify-center w-5 h-5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500">{kpi.code}</span>
              <span className="text-sm font-medium text-white">{kpi.title}</span>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-3 py-3 text-center">
          <span
            className={cn(
              'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full border capitalize',
              getHealthClass(kpi.health)
            )}
          >
            {kpi.health === 'on-track' ? '●' : kpi.health === 'at-risk' ? '◐' : '○'}
          </span>
        </td>

        {/* Trend */}
        <td className="px-3 py-3">
          <div className="flex items-center justify-center">
            <TrendIcon
              className={cn(
                'w-4 h-4',
                getTrendColor(kpi.trend, true)
              )}
            />
          </div>
        </td>

        {/* Unit */}
        <td className="px-3 py-3 text-center text-sm text-slate-400">{kpi.unit}</td>

        {/* Owner */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-1">
            {owners.slice(0, 2).map((owner) => (
              <div
                key={owner.id}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs font-medium"
                title={`${owner.name} - ${owner.role}`}
              >
                {owner.initials}
              </div>
            ))}
            {owners.length > 2 && (
              <span className="text-xs text-slate-500">+{owners.length - 2}</span>
            )}
          </div>
        </td>

        {/* Monthly Data Cells */}
        {kpi.monthlyData.map((monthData, monthIndex) => (
          <td key={monthData.month} className="px-1 py-2">
            <EditableMonthlyCell
              kpiId={kpi.id}
              monthData={monthData}
              unit={kpi.unit}
              lowerBetter={lowerBetter}
              monthIndex={monthIndex}
              onSave={onUpdateMonthly}
            />
          </td>
        ))}
      </motion.tr>

      {/* Expanded Detail Row */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={5 + months.length} className="bg-slate-900/30 px-8 py-4 border-b border-slate-800">
              <ExpandedKPIDetail kpi={kpi} />
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
});

// ============================================================================
// EDITABLE MONTHLY CELL — Edit state is local (no store re-render per keystroke)
// Supports editing both actual AND target values
// ============================================================================
interface EditableMonthlyCellProps {
  kpiId: string;
  monthData: MonthlyKPIData;
  unit: string;
  lowerBetter: boolean;
  monthIndex: number;
  onSave: (kpiId: string, month: string, patch: { target?: number; actual?: number | null }) => Promise<void>;
}

function EditableMonthlyCell({ kpiId, monthData, unit, lowerBetter, monthIndex, onSave }: EditableMonthlyCellProps) {
  const [isEditingActual, setIsEditingActual] = useState(false);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPast = monthIndex <= CURRENT_MONTH_INDEX;
  const isCurrent = monthIndex === CURRENT_MONTH_INDEX;
  const isFuture = monthIndex > CURRENT_MONTH_INDEX;

  const handleStartEditActual = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click
    setEditValue(monthData.actual !== null ? String(monthData.actual) : '');
    setIsEditingActual(true);
  }, [monthData.actual]);

  const handleStartEditTarget = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(String(monthData.target));
    setIsEditingTarget(true);
  }, [monthData.target]);

  useEffect(() => {
    if ((isEditingActual || isEditingTarget) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingActual, isEditingTarget]);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    let newValue: number | null = null;

    if (isEditingActual && (trimmed === '' || trimmed === '—')) {
      newValue = null; // Clear actual value
    } else {
      const parsed = parseFloat(trimmed);
      if (isNaN(parsed)) {
        // Invalid — cancel edit
        setIsEditingActual(false);
        setIsEditingTarget(false);
        return;
      }
      newValue = Math.round(parsed * 100) / 100; // 2 decimal places 
    }

    // Don't save if nothing changed
    if (isEditingActual && newValue === monthData.actual) {
      setIsEditingActual(false);
      return;
    }
    if (isEditingTarget && newValue === monthData.target) {
      setIsEditingTarget(false);
      return;
    }

    setIsSaving(true);
    try {
      if (isEditingActual) {
        await onSave(kpiId, monthData.month, { actual: newValue });
      } else if (isEditingTarget) {
        await onSave(kpiId, monthData.month, { target: newValue as number });
      }
    } finally {
      setIsSaving(false);
      setIsEditingActual(false);
      setIsEditingTarget(false);
    }
  }, [editValue, monthData.actual, monthData.target, monthData.month, kpiId, onSave, isEditingActual, isEditingTarget]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditingActual(false);
      setIsEditingTarget(false);
    } else if (e.key === 'Tab') {
      handleSave();
      // Don't prevent default — let Tab naturally move focus
    }
  }, [handleSave]);

  const getVarianceColor = (pct: number | null) => {
    if (pct === null) return 'bg-slate-800 border-slate-800';
    if (pct >= 0) return 'bg-emerald-500/20 border-emerald-500/30';
    if (pct >= -5) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const rawPct = computeVariancePercent(monthData.actual, monthData.target);
  const effectivePct = rawPct === null ? null : (lowerBetter ? -rawPct : rawPct);

  // Editing state
  if (isEditingActual || isEditingTarget) {
    return (
      <div className="relative flex flex-col items-center p-1 rounded-md border-2 border-blue-500 bg-slate-800 min-h-[48px]">
        <div className="text-[10px] text-slate-500 leading-none">
          {isEditingTarget ? 'Target' : `T: ${formatValue(monthData.target, unit)}`}
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full mt-0.5 px-1 py-0 text-xs font-semibold text-white text-center bg-transparent border-none outline-none"
          style={{ maxWidth: '60px' }}
        />
        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-md">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // Display state
  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-1.5 rounded-md border transition-all min-h-[48px]',
        isPast ? getVarianceColor(effectivePct) : 'bg-slate-800/30 border-slate-800',
        isCurrent && 'ring-1 ring-blue-500/50',
        (isPast || isFuture) && 'cursor-pointer hover:ring-1 hover:ring-slate-500/50'
      )}
      suppressHydrationWarning
      title="Double-click actual to edit | Ctrl+click target to edit"
      onClick={(e) => e.stopPropagation()} // Prevent detail panel from opening when clicking monthly cell
    >
      {/* Target - Ctrl+Click to edit */}
      <div 
        className="text-[10px] text-slate-500 leading-none cursor-pointer hover:text-slate-400" 
        suppressHydrationWarning
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            handleStartEditTarget(e);
          }
        }}
        title="Ctrl+click to edit target"
      >
        T: {formatValue(monthData.target, unit)}
      </div>

      {/* Actual - Double-click to edit */}
      {monthData.actual !== null ? (
        <div 
          className="text-xs font-semibold text-white leading-tight mt-0.5 cursor-pointer hover:text-blue-300" 
          suppressHydrationWarning
          onDoubleClick={handleStartEditActual}
        >
          {formatValue(monthData.actual, unit)}
        </div>
      ) : (
        <div 
          className="text-xs text-slate-600 leading-tight mt-0.5 cursor-pointer hover:text-slate-500" 
          onDoubleClick={handleStartEditActual}
          title="Double-click to add actual value"
        >
          —
        </div>
      )}

      {/* Variance indicator bar — suppressHydrationWarning on both divs because
           server renders with mockData values, client may have real DB values:
           both className (colour) and style (width) are data-dependent. */}
      {monthData.variance !== null && (
        <div className="w-full h-1 mt-1 rounded-full bg-slate-700 overflow-hidden" suppressHydrationWarning>
          <div
            suppressHydrationWarning
            className={cn(
              'h-full rounded-full transition-all',
              effectivePct === null ? 'bg-slate-600' : effectivePct >= 0 ? 'bg-emerald-500' : effectivePct >= -5 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{
              // Use variance-% for width so bars are comparable across KPIs of different scales.
              // 50 % = neutral (0 variance), clamp 5–95 so bar is always slightly visible.
              width: `${
                Math.min(
                  Math.max(
                    50 + (effectivePct ?? 0),
                    5
                  ),
                  95
                )
              }%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPANDED ROW DETAIL — Shows detailed month-by-month breakdown
// ============================================================================
function ExpandedKPIDetail({ kpi }: { kpi: KPI }) {
  const lowerBetter = isLowerBetter(kpi.unit, kpi.code);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-8">
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Current</span>
          <p className="text-lg font-bold text-white" suppressHydrationWarning>{formatValue(kpi.currentValue, kpi.unit)} {kpi.unit}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Target</span>
          <p className="text-lg font-bold text-slate-300" suppressHydrationWarning>{formatValue(kpi.targetValue, kpi.unit)} {kpi.unit}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Overall Variance</span>
          <p className={cn(
            'text-lg font-bold',
            (kpi.currentValue - kpi.targetValue) >= 0 ? 'text-emerald-400' : 'text-red-400'
          )} suppressHydrationWarning>
            {formatVariance(kpi.currentValue - kpi.targetValue, kpi.unit)} {kpi.unit}
          </p>
        </div>
      </div>

      {/* Detailed monthly table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-2 py-1 text-left text-slate-500 font-medium w-20">Metric</th>
              {months.map((m, idx) => (
                <th
                  key={m}
                  className={cn(
                    'px-2 py-1 text-center font-medium w-16',
                    idx === CURRENT_MONTH_INDEX ? 'text-blue-400' : 'text-slate-500'
                  )}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Target row */}
            <tr className="border-b border-slate-800/50">
              <td className="px-2 py-1.5 text-slate-400 font-medium">Target</td>
              {kpi.monthlyData.map((m) => (
                <td key={m.month} className="px-2 py-1.5 text-center text-slate-300" suppressHydrationWarning>
                  {formatValue(m.target, kpi.unit)}
                </td>
              ))}
            </tr>
            {/* Actual row */}
            <tr className="border-b border-slate-800/50">
              <td className="px-2 py-1.5 text-slate-400 font-medium">Actual</td>
              {kpi.monthlyData.map((m) => (
                <td key={m.month} className="px-2 py-1.5 text-center font-semibold text-white" suppressHydrationWarning>
                  {formatValue(m.actual, kpi.unit)}
                </td>
              ))}
            </tr>
            {/* Variance row */}
            <tr className="border-b border-slate-800/50">
              <td className="px-2 py-1.5 text-slate-400 font-medium">Δ Var</td>
              {kpi.monthlyData.map((m) => {
                const pct = computeVariancePercent(m.actual, m.target);
                const effectivePct = pct === null ? null : (lowerBetter ? -pct : pct);

                return (
                  <td
                    key={m.month}
                    className={cn(
                      'px-2 py-1.5 text-center font-medium',
                      effectivePct === null ? 'text-slate-600' :
                      effectivePct >= 0 ? 'text-emerald-400' :
                      effectivePct >= -5 ? 'text-yellow-400' : 'text-red-400'
                    )}
                    suppressHydrationWarning
                  >
                    {formatVariance(m.variance, kpi.unit)}
                  </td>
                );
              })}
            </tr>
            {/* Variance % row */}
            <tr>
              <td className="px-2 py-1.5 text-slate-400 font-medium">Δ %</td>
              {kpi.monthlyData.map((m) => {
                const pct = computeVariancePercent(m.actual, m.target);
                const effectivePct = pct === null ? null : (lowerBetter ? -pct : pct);
                return (
                  <td
                    key={m.month}
                    className={cn(
                      'px-2 py-1.5 text-center font-medium',
                      effectivePct === null ? 'text-slate-600' :
                      effectivePct >= 0 ? 'text-emerald-400' :
                      effectivePct >= -5 ? 'text-yellow-400' : 'text-red-400'
                    )}
                    suppressHydrationWarning
                  >
                    {pct !== null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
