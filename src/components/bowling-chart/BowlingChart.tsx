'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useXMatrixStore } from '@/lib/store';
import { cn, getHealthClass, getTrendIcon, getTrendColor, getStatusLabel } from '@/lib/utils';
import { KPI, HealthStatus, Owner } from '@/lib/types';
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Search,
  X,
} from 'lucide-react';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function BowlingChart() {
  const { data, setHoveredElement, setSelectedElement, viewState } = useXMatrixStore();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    health: null as HealthStatus | null,
    owner: null as string | null,
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredKpis = useMemo(() => {
    return data.kpis.filter((kpi) => {
      if (filters.health && kpi.health !== filters.health) return false;
      if (filters.owner && !kpi.ownerIds.includes(filters.owner)) return false;
      if (filters.search && !kpi.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [data.kpis, filters]);

  const getOwnersByIds = (ids: string[]): Owner[] => {
    return data.owners.filter((o) => ids.includes(o.id));
  };

  const clearFilters = () => {
    setFilters({ health: null, owner: null, search: '' });
  };

  const hasActiveFilters = filters.health || filters.owner || filters.search;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">KPI Scorecard</h2>
          <span className="px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-800 rounded">
            {filteredKpis.length} of {data.kpis.length} KPIs
          </span>
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
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              showFilters
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex items-center justify-center w-5 h-5 text-xs bg-blue-500 text-white rounded-full">
                {[filters.health, filters.owner].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
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
              <th className="sticky left-0 z-20 bg-slate-900 px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-64">
                KPI
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">
                Status
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">
                Trend
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">
                Unit
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-40">
                Owner
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className="px-2 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-24"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredKpis.map((kpi, index) => (
              <KPIRow
                key={kpi.id}
                kpi={kpi}
                owners={getOwnersByIds(kpi.ownerIds)}
                isExpanded={expandedRows.has(kpi.id)}
                onToggle={() => toggleRow(kpi.id)}
                onHover={(hover) => setHoveredElement(hover ? { id: kpi.id, type: 'kpi' } : null)}
                onClick={() => setSelectedElement({ id: kpi.id, type: 'kpi' })}
                index={index}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface KPIRowProps {
  kpi: KPI;
  owners: Owner[];
  isExpanded: boolean;
  onToggle: () => void;
  onHover: (hover: boolean) => void;
  onClick: () => void;
  index: number;
}

function KPIRow({ kpi, owners, isExpanded, onToggle, onHover, onClick, index }: KPIRowProps) {
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const currentMonth = 0; // January

  return (
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
              getTrendColor(kpi.trend, kpi.unit !== 'days' && kpi.unit !== '%' || kpi.code !== 'K-6')
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

      {/* Monthly Data */}
      {kpi.monthlyData.map((data, monthIndex) => (
        <td key={data.month} className="px-1 py-2">
          <MonthlyCell
            target={data.target}
            actual={data.actual}
            variance={data.variance}
            unit={kpi.unit}
            isPast={monthIndex <= currentMonth}
            isCurrent={monthIndex === currentMonth}
          />
        </td>
      ))}
    </motion.tr>
  );
}

interface MonthlyCellProps {
  target: number;
  actual: number | null;
  variance: number | null;
  unit: string;
  isPast: boolean;
  isCurrent: boolean;
}

function MonthlyCell({ target, actual, variance, unit, isPast, isCurrent }: MonthlyCellProps) {
  const getVarianceColor = (v: number | null) => {
    if (v === null) return 'bg-slate-800';
    if (v >= 0) return 'bg-emerald-500/20 border-emerald-500/30';
    if (v >= -5) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const formatValue = (v: number) => {
    if (unit === '$M') return v.toFixed(1);
    if (unit === '%') return v.toFixed(0);
    return v.toFixed(0);
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-1.5 rounded-md border transition-all min-h-[48px]',
        isPast ? getVarianceColor(variance) : 'bg-slate-800/30 border-slate-800',
        isCurrent && 'ring-1 ring-blue-500/50'
      )}
    >
      {/* Target */}
      <div className="text-[10px] text-slate-500 leading-none">
        T: {formatValue(target)}
      </div>

      {/* Actual */}
      {actual !== null ? (
        <div className="text-xs font-semibold text-white leading-tight mt-0.5">
          {formatValue(actual)}
        </div>
      ) : (
        <div className="text-xs text-slate-600 leading-tight mt-0.5">—</div>
      )}

      {/* Variance indicator bar */}
      {variance !== null && (
        <div className="w-full h-1 mt-1 rounded-full bg-slate-700 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              variance >= 0 ? 'bg-emerald-500' : variance >= -5 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${Math.min(Math.abs(variance) + 50, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
