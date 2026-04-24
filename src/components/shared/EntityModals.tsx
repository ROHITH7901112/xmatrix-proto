'use client';
//what is the purpose of this file? what components does it export? it contains modal and form components for creating/editing Long-Term Objectives (LTOs), Annual Objectives (AOs), Initiatives, and KPIs. These components are designed to be reusable across the application, providing a consistent UI and handling form state management for these entities. The file exports the following components: they are 

import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { LongTermObjective, AnnualObjective, Initiative, KPI, Owner, HealthStatus, ResponsibilityType, Trend, TargetDistribution, KPI_UNITS } from '@/lib/types';
import { generateId, cn } from '@/lib/utils';
import { deriveHealth, deriveTrend, getCurrentValue, isLowerBetter } from '@/lib/kpi-calculations';

// Helper function to calculate next sequential code
function getNextCode(existingCodes: string[], prefix: string): string {
    const numbers = existingCodes
        .filter(code => code.startsWith(prefix))
        .map(code => {
            const match = code.match(new RegExp(`${prefix}-(\\d+)`));
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}-${maxNumber + 1}`;
}

// Modal component
export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    const { colors } = useTheme();
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm", colors.bg.overlay)}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className={cn("w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col", colors.card)}
                >
                    <div className={cn("flex items-center justify-between px-6 py-4 border-b flex-shrink-0", colors.border.light)}>
                        <h2 className={cn("text-lg font-semibold", colors.text.primary)}>{title}</h2>
                        <button onClick={onClose} className={cn("p-1 rounded-lg transition-colors", colors.text.secondary, "hover:" + colors.text.primary, "hover:" + colors.bg.tertiary)}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">{children}</div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Form input component
export function FormInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    const { colors } = useTheme();
    return (
        <div className="space-y-1.5">
            <label className={cn("block text-sm font-medium", colors.text.secondary)}>{label}</label>
            <input
                {...props}
                className={cn("w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", colors.input)}
            />
        </div>
    );
}

// Form select component
export function FormSelect({ label, options, ...props }: { label: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
    const { colors } = useTheme();
    return (
        <div className="space-y-1.5">
            <label className={cn("block text-sm font-medium", colors.text.secondary)}>{label}</label>
            <select
                {...props}
                className={cn("w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", colors.input)}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

// Form textarea component
export function FormTextarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const { colors } = useTheme();
    return (
        <div className="space-y-1.5">
            <label className={cn("block text-sm font-medium", colors.text.secondary)}>{label}</label>
            <textarea
                {...props}
                className={cn("w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none", colors.input)}
                rows={3}
            />
        </div>
    );
}

// LTO Form
export function LTOForm({
    initialData,
    existingItems,
    onSubmit,
    onDelete,
    onCancel,
    isLoading
}: {
    initialData?: LongTermObjective;
    existingItems?: LongTermObjective[];
    onSubmit: (data: LongTermObjective) => void;
    onDelete?: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const nextCode = !initialData && existingItems ? getNextCode(existingItems.map(item => item.code), 'LTO') : '';
    const [formData, setFormData] = useState<LongTermObjective>(initialData || {
        id: generateId('lto'),
        code: nextCode,
        title: '',
        description: '',
        timeframe: '2025-2028',
        health: 'on-track',
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Code" placeholder="LTO-1" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                <FormInput label="Timeframe" placeholder="2025-2028" value={formData.timeframe} onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })} required />
            </div>
            <FormInput label="Title" placeholder="Market Leadership in Enterprise Solutions" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <FormTextarea label="Description" placeholder="Describe the long-term objective..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <FormSelect
                label="Status"
                value={formData.health}
                onChange={(e) => setFormData({ ...formData, health: e.target.value as HealthStatus })}
                options={[
                    { value: 'on-track', label: 'On Track' },
                    { value: 'at-risk', label: 'At Risk' },
                    { value: 'off-track', label: 'Off Track' },
                ]}
            />
            <div className="flex justify-between pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initialData ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </form>
    );
}

// AO Form
export function AOForm({
    initialData,
    existingItems,
    onSubmit,
    onDelete,
    onCancel,
    isLoading
}: {
    initialData?: AnnualObjective;
    existingItems?: AnnualObjective[];
    onSubmit: (data: AnnualObjective) => void;
    onDelete?: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const nextCode = !initialData && existingItems ? getNextCode(existingItems.map(item => item.code), 'AO') : '';
    const [formData, setFormData] = useState<AnnualObjective>(initialData || {
        id: generateId('ao'),
        code: nextCode,
        title: '',
        description: '',
        year: new Date().getFullYear(),
        health: 'on-track',
        progress: 0,
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Code" placeholder="AO-1" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                <FormInput label="Year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} required />
            </div>
            <FormInput label="Title" placeholder="Expand Enterprise Client Base" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <FormTextarea label="Description" placeholder="Describe the annual objective..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
                <FormSelect
                    label="Status"
                    value={formData.health}
                    onChange={(e) => setFormData({ ...formData, health: e.target.value as HealthStatus })}
                    options={[
                        { value: 'on-track', label: 'On Track' },
                        { value: 'at-risk', label: 'At Risk' },
                        { value: 'off-track', label: 'Off Track' },
                    ]}
                />
                <FormInput label="Progress (%)" type="number" min="0" max="100" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex justify-between pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initialData ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </form>
    );
}

// Initiative Form
export function InitiativeForm({
    initialData,
    existingItems,
    onSubmit,
    onDelete,
    onCancel,
    isLoading
}: {
    initialData?: Initiative;
    existingItems?: Initiative[];
    onSubmit: (data: Initiative) => void;
    onDelete?: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const today = new Date().toISOString().split('T')[0];
    const nextCode = !initialData && existingItems ? getNextCode(existingItems.map(item => item.code), 'I') : '';
    const [formData, setFormData] = useState<Initiative>(initialData || {
        id: generateId('init'),
        code: nextCode,
        title: '',
        description: '',
        priority: 'medium',
        health: 'on-track',
        startDate: today,
        endDate: today,
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Code" placeholder="I-1" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                <FormSelect
                    label="Priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'blocker' | 'critical' | 'major' | 'medium' | 'trivial' })}
                    options={[
                        { value: 'blocker', label: 'Blocker' },
                        { value: 'critical', label: 'Critical' },
                        { value: 'major', label: 'Major' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'trivial', label: 'Trivial' },
                    ]}
                />
            </div>
            <FormInput label="Title" placeholder="Enterprise Sales Acceleration Program" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <FormTextarea label="Description" placeholder="Describe the initiative..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                <FormInput label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
            </div>
            <FormSelect
                label="Status"
                value={formData.health}
                onChange={(e) => setFormData({ ...formData, health: e.target.value as HealthStatus })}
                options={[
                    { value: 'on-track', label: 'On Track' },
                    { value: 'at-risk', label: 'At Risk' },
                    { value: 'off-track', label: 'Off Track' },
                ]}
            />
            <div className="flex justify-between pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initialData ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </form>
    );
}

// ============================================================================
// Target distribution helper
// ============================================================================

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function computeDistributedTargets(
  totalTarget: number,
  startDate: string,
  endDate: string,
  distribution: TargetDistribution,
  currentValue: number = 0,
): MonthlyKPIData[] {
  if (!startDate || !endDate) {
    // No dates set — all months get equal share
    const perMonth = totalTarget / 12;
    return ALL_MONTHS.map(month => ({ month, target: Math.round(perMonth * 100) / 100, actual: null, variance: null }));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Determine active month indices (0-based)
  const activeIndices: number[] = [];
  for (let i = 0; i < 12; i++) {
    // Use the first day of each month in the current year of start
    const monthDate = new Date(start.getFullYear(), i, 1);
    const monthEnd = new Date(start.getFullYear(), i + 1, 0);
    if (monthEnd >= start && monthDate <= end) activeIndices.push(i);
  }

  if (activeIndices.length === 0) {
    return ALL_MONTHS.map(month => ({ month, target: 0, actual: null, variance: null }));
  }

  const n = activeIndices.length;
  let weights: number[];

  switch (distribution) {
    case 'linear': {
      // Ramp up: weight proportional to position (1, 2, 3, …n)
      weights = activeIndices.map((_, idx) => idx + 1);
      break;
    }
    case 'front-loaded': {
      // Heavier on early months: n, n-1, …1
      weights = activeIndices.map((_, idx) => n - idx);
      break;
    }
    case 'equal':
    default:
      weights = activeIndices.map(() => 1);
  }

  // Split active months into past (already happened) and future (from today onwards)
  // Past months: get targets based on their share of the TOTAL target (for reference)
  //              actuals are left null — user enters them manually
  // Future months: only carry the REMAINING target (totalTarget - currentValue)
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0=Jan, 1=Feb, ... 11=Dec

  const pastActiveIndices = activeIndices.filter(idx => idx < currentMonthIdx);
  const futureActiveIndices = activeIndices.filter(idx => idx >= currentMonthIdx);

  const remainingTarget = Math.max(0, totalTarget - currentValue);

  // Weights for future months only (to distribute remaining target)
  const futureWeights = futureActiveIndices.map((_, i) => {
    const posInAll = activeIndices.indexOf(futureActiveIndices[i]);
    if (distribution === 'linear') return posInAll + 1;
    if (distribution === 'front-loaded') return n - posInAll;
    return 1;
  });
  const futureTotalWeight = futureWeights.reduce((a, b) => a + b, 0) || 1;
  const futureTargets = futureWeights.map(w =>
    Math.round((remainingTarget * w / futureTotalWeight) * 100) / 100
  );
  // Fix rounding residual on last future month
  const futureDiff = remainingTarget - futureTargets.reduce((a, b) => a + b, 0);
  if (futureTargets.length > 0) {
    futureTargets[futureTargets.length - 1] = Math.round((futureTargets[futureTargets.length - 1] + futureDiff) * 100) / 100;
  }

  // Weights for past months (their share of TOTAL target, for reference targets)
  const pastWeights = pastActiveIndices.map((_, i) => {
    const posInAll = activeIndices.indexOf(pastActiveIndices[i]);
    if (distribution === 'linear') return posInAll + 1;
    if (distribution === 'front-loaded') return n - posInAll;
    return 1;
  });
  const pastTotalWeight = pastWeights.reduce((a, b) => a + b, 0) || 1;
  // Past month targets = their share of totalTarget (reference only, actuals entered manually)
  const pastTargets = pastWeights.map(w =>
    Math.round((totalTarget * w / (pastTotalWeight + futureTotalWeight)) * 100) / 100
  );

  // Build target map
  const targetMap = new Map<number, number>();
  pastActiveIndices.forEach((mi, i) => targetMap.set(mi, pastTargets[i] ?? 0));
  futureActiveIndices.forEach((mi, i) => targetMap.set(mi, futureTargets[i] ?? 0));

  // Actuals: past months are left null for manual entry
  return ALL_MONTHS.map((month, idx) => ({
    month,
    target: targetMap.get(idx) ?? 0,
    actual: null, // Always null — user enters actuals manually in the Bowling Chart
    variance: null,
  }));
}

interface MonthlyKPIData {
  month: string;
  target: number;
  actual: number | null;
  variance: number | null;
}

// ============================================================================
// KPI Form
// ============================================================================

// KPI Form
export function KPIForm({
    initialData,
    existingItems,
    availableOwners,
    onSubmit,
    onDelete,
    onCancel,
    isLoading
}: {
    initialData?: KPI;
    existingItems?: KPI[];
    availableOwners?: Owner[];
    onSubmit: (data: KPI) => void;
    onDelete?: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const today = new Date().toISOString().split('T')[0];
    const nextCode = !initialData && existingItems ? getNextCode(existingItems.map(item => item.code), 'K') : '';
    const [formData, setFormData] = useState<KPI>(initialData || {
        id: generateId('kpi'),
        code: nextCode,
        title: '',
        unit: '%',
        currentValue: 0,
        targetValue: 100,
        health: 'on-track',
        trend: 'stable',
        ownerIds: [],
        monthlyData: [],
        startDate: today,
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
        targetDistribution: 'equal',
    });

    // Whenever target, dates or distribution changes, preview the monthly split
    const previewMonthly = computeDistributedTargets(
        formData.targetValue,
        formData.startDate || '',
        formData.endDate || '',
        formData.targetDistribution || 'equal',
        formData.currentValue,
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 

        // Check if target calculation parameters changed
        const targetParamsChanged =
            !initialData ||
            initialData.targetValue !== formData.targetValue ||
            initialData.startDate !== formData.startDate ||
            initialData.endDate !== formData.endDate ||
            initialData.targetDistribution !== formData.targetDistribution;

        let monthlyData: (typeof formData.monthlyData) = []; 

        if (targetParamsChanged) {
            // Recalculate targets if parameters changed, but preserve actuals
            const distributedTargets = computeDistributedTargets(
            formData.targetValue,
            formData.startDate || '',
            formData.endDate || '',
            formData.targetDistribution || 'equal',
            formData.currentValue,
            );

            const existingByMonth = new Map(
            (initialData?.monthlyData ?? []).map((m) => [m.month, m]) 
            );
            monthlyData = distributedTargets.map((m) => {
            const existing = existingByMonth.get(m.month);
            return {
                ...m, //
                actual: existing?.actual ?? m.actual,
                variance: existing?.variance ?? m.variance,
                year: existing?.year,
            };
            });
        } else {
            // Target parameters didn't change, preserve all existing monthly data
            monthlyData = initialData?.monthlyData ?? [];
        }
        
        // Calculate health and trend automatically from monthly data
        const lowerBetter = isLowerBetter(formData.unit, formData.code);
        const calculatedHealth = deriveHealth(monthlyData, undefined, lowerBetter, formData.targetValue);
        const calculatedTrend = deriveTrend(monthlyData, lowerBetter);
        
        const kpiWithMonthly: KPI = {
            ...formData,
            monthlyData,
            health: calculatedHealth,
            trend: calculatedTrend,
            // Keep user-entered current value; do not overwrite it from generated monthly data.
            currentValue: formData.currentValue,
        };
        onSubmit(kpiWithMonthly);
    };

    const isCustomUnit = !KPI_UNITS.some(u => u.value === formData.unit && u.value !== 'custom');

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code + Unit row */}
            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="Code"
                    placeholder="K-1"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                />
                {/* Unit dropdown */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Unit</label>
                    <select
                        value={KPI_UNITS.some(u => u.value === formData.unit) ? formData.unit : 'custom'}
                        onChange={(e) => {
                            if (e.target.value === 'custom') {
                                setFormData({ ...formData, unit: '' });
                            } else {
                                setFormData({ ...formData, unit: e.target.value });
                            }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                        {KPI_UNITS.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                    </select>
                    {/* Custom unit input */}
                    {(!KPI_UNITS.some(u => u.value === formData.unit) || formData.unit === '') && (
                        <input
                            type="text"
                            placeholder="Enter custom unit…"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            required
                            className="w-full px-3 py-2 mt-1 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    )}
                </div>
            </div>

            {/* Title */}
            <FormInput
                label="Title"
                placeholder="e.g. Enterprise Win Rate"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
            />

            {/* Owner(s) */}
            {availableOwners && availableOwners.length > 0 && (
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">
                        Owner(s)
                        {formData.ownerIds.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-blue-400">{formData.ownerIds.length} selected</span>
                        )}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {availableOwners.map(owner => {
                            const isSelected = formData.ownerIds.includes(owner.id);
                            return (
                                <button
                                    key={owner.id}
                                    type="button"
                                    onClick={() => {
                                        const newOwnerIds = isSelected
                                            ? formData.ownerIds.filter(id => id !== owner.id)
                                            : [...formData.ownerIds, owner.id];
                                        setFormData({ ...formData, ownerIds: newOwnerIds });
                                    }}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all',
                                        isSelected
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                    )}
                                >
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-[10px] font-bold flex-shrink-0">
                                        {owner.initials}
                                    </div>
                                    <span>{owner.name}</span>
                                    {isSelected && (
                                        <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {formData.ownerIds.length === 0 && (
                        <p className="text-xs text-slate-500">Click to assign owner(s)</p>
                    )}
                </div>
            )}

            {/* Current + Total Target */}
            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="Current Value"
                    type="number"
                    step="0.01"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
                    required
                />
                <FormInput
                    label={`Annual Target (${formData.unit || '?'})`}
                    type="number"
                    step="0.01"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                    required
                />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="Start Date"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                />
                <FormInput
                    label="End Date"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                />
            </div>

            {/* Distribution method */}
            <FormSelect
                label="Target Distribution Across Months"
                value={formData.targetDistribution || 'equal'}
                onChange={(e) => setFormData({ ...formData, targetDistribution: e.target.value as TargetDistribution })}
                options={[
                    { value: 'equal', label: 'Equal — same target every active month' },
                    { value: 'linear', label: 'Linear ramp-up — increases each month' },
                    { value: 'front-loaded', label: 'Front-loaded — higher target in early months' },
                ]}
            />

            {/* Monthly target preview */}
            <div className="rounded-lg border border-slate-700 overflow-hidden">
                <div className="px-3 py-2 bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Monthly Target Preview
                </div>
                <div className="grid grid-cols-6 gap-px bg-slate-700">
                    {previewMonthly.map(({ month, target }) => (
                        <div key={month} className="flex flex-col items-center px-1 py-2 bg-slate-900 text-center">
                            <span className="text-[10px] text-slate-500 mb-0.5">{month}</span>
                            <span className={`text-xs font-semibold ${target > 0 ? 'text-blue-300' : 'text-slate-600'}`}>
                                {target > 0 ? target : '—'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status + Trend (Auto-calculated from monthly data) */}
            <div className="rounded-lg border border-slate-700 px-3 py-2 bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-2">Status &amp; Trend will be calculated automatically from the monthly data in the Bowling Chart.</p>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initialData ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </form>
    );
}

// Owner Form
export function OwnerForm({
    initialData,
    onSubmit,
    onDelete,
    onCancel,
    isLoading
}: {
    initialData?: Owner;
    onSubmit: (data: Owner) => void;
    onDelete?: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const [formData, setFormData] = useState<Owner>(initialData || {
        id: generateId('owner'),
        name: '',
        role: '',
        avatar: '',
        initials: '',
        responsibilityType: 'responsible',
    });

    // Auto-generate initials from name
    const updateName = (name: string) => {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        setFormData({ ...formData, name, initials });
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <FormInput label="Name" placeholder="John Smith" value={formData.name} onChange={(e) => updateName(e.target.value)} required />
            <FormInput label="Role" placeholder="Role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required />
            <FormInput label="Initials" placeholder="JS" maxLength={3} value={formData.initials} onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })} required />
            <FormSelect
                label="Responsibility Type"
                value={formData.responsibilityType}
                onChange={(e) => setFormData({ ...formData, responsibilityType: e.target.value as ResponsibilityType })}
                options={[
                    { value: 'accountable', label: 'Accountable' },
                    { value: 'responsible', label: 'Responsible' },
                    { value: 'consulted', label: 'Consulted' },
                    { value: 'informed', label: 'Informed' },
                ]}
            />
            <div className="flex justify-between pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initialData ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </form>
    );
}
