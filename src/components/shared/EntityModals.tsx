'use client';
//what is the purpose of this file? what components does it export? it contains modal and form components for creating/editing Long-Term Objectives (LTOs), Annual Objectives (AOs), Initiatives, and KPIs. These components are designed to be reusable across the application, providing a consistent UI and handling form state management for these entities. The file exports the following components: they are 

import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { LongTermObjective, AnnualObjective, Initiative, KPI, Owner, ResponsibilityType, TargetDistribution, KPI_UNITS, MonthlyKPIData } from '@/lib/types';
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

const primaryActionClass = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold shadow-lg shadow-blue-500/25 ring-1 ring-white/10 hover:from-blue-400 hover:to-violet-500 hover:shadow-blue-500/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryActionClass = 'px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors';
const dangerActionClass = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-white transition-colors';

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
        timeframe: '2026-2029',
        health: 'on-track',
        status: 'active',
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Code" placeholder="LTO-1" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                <FormInput label="Timeframe" placeholder="2026-2029" value={formData.timeframe} onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })} required />
            </div>
            <FormInput label="Title" placeholder="Market Leadership in Enterprise Solutions" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <FormTextarea label="Description" placeholder="Describe the long-term objective..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div className="flex justify-between pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className={dangerActionClass}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className={secondaryActionClass}>Cancel</button>
                    <button type="submit" disabled={isLoading} className={primaryActionClass}>
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
        status: 'active',
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Code" placeholder="AO-1" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                <FormInput label="Year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} required />
            </div>
            <FormInput label="Title" placeholder="Expand Enterprise Client Base" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <FormTextarea label="Description" placeholder="Describe the annual objective..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div className="flex justify-between pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className={dangerActionClass}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className={secondaryActionClass}>Cancel</button>
                    <button type="submit" disabled={isLoading} className={primaryActionClass}>
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
        status: 'active',
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
            <div className="flex justify-between pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className={dangerActionClass}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className={secondaryActionClass}>Cancel</button>
                    <button type="submit" disabled={isLoading} className={primaryActionClass}>
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

interface ActiveMonth {
    year: number;
    month: string;
    monthIndex: number;
}

const getActiveMonths = (startDate: string, endDate: string): ActiveMonth[] => {
    if (!startDate || !endDate) {
        const year = new Date().getFullYear();
        return ALL_MONTHS.map((month, monthIndex) => ({ year, month, monthIndex }));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        const year = new Date().getFullYear();
        return ALL_MONTHS.map((month, monthIndex) => ({ year, month, monthIndex }));
    }

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);
    const months: ActiveMonth[] = [];

    // Safety cap: keep range finite in case of malformed inputs
    while (cursor <= endCursor && months.length < 60) {
        months.push({
            year: cursor.getFullYear(),
            month: ALL_MONTHS[cursor.getMonth()],
            monthIndex: cursor.getMonth(),
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
};

const weightedSplit = (total: number, weights: number[]): number[] => {
    const safeTotal = Number.isFinite(total) ? total : 0;
    const safeWeights = weights.map(w => (Number.isFinite(w) && w > 0 ? w : 0));
    const denom = safeWeights.reduce((a, b) => a + b, 0);
    if (safeWeights.length === 0 || denom <= 0) return [];

    const split = safeWeights.map(w => Math.round((safeTotal * w / denom) * 100) / 100);
    const sum = split.reduce((a, b) => a + b, 0);
    const diff = Math.round((safeTotal - sum) * 100) / 100;
    split[split.length - 1] = Math.round((split[split.length - 1] + diff) * 100) / 100;
    return split;
};

const getMonthlyRowKey = (year: number | undefined, month: string) => `${year ?? ''}-${month}`;

const sumMonthlyTargets = (monthlyData: MonthlyKPIData[]) =>
    Math.round(monthlyData.reduce((sum, row) => sum + (Number.isFinite(row.target) ? row.target : 0), 0) * 100) / 100;

const buildCustomMonthlyTargets = (
  startDate: string,
  endDate: string,
  totalTarget: number,
  existingMonthlyData: MonthlyKPIData[] = [],
): MonthlyKPIData[] => {
    const activeMonths = getActiveMonths(startDate, endDate);
    if (activeMonths.length === 0) return [];

    const existingByKey = new Map<string, MonthlyKPIData>();
    existingMonthlyData.forEach((row) => {
        existingByKey.set(getMonthlyRowKey(row.year, row.month), row);
        existingByKey.set(row.month, row);
    });

    const fallbackTarget = Math.round((totalTarget / activeMonths.length) * 100) / 100;

    return activeMonths.map((month) => {
        const existing = existingByKey.get(getMonthlyRowKey(month.year, month.month)) ?? existingByKey.get(month.month);
        return {
            year: month.year,
            month: month.month,
            target: existing?.target ?? fallbackTarget,
            actual: existing?.actual ?? null,
            variance: existing?.variance ?? null,
        };
    });
};

function computeDistributedTargets(
  totalTarget: number,
  startDate: string,
  endDate: string,
  distribution: TargetDistribution,
  currentValue: number = 0,
): MonthlyKPIData[] {
    const activeMonths = getActiveMonths(startDate, endDate);
    if (activeMonths.length === 0) return [];

    const n = activeMonths.length;
    const allWeights = activeMonths.map((_, idx) => {
        if (distribution === 'linear') return idx + 1;
        if (distribution === 'front-loaded') return n - idx;
        return 1;
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const pastIndices = activeMonths
        .map((m, idx) => ({ ...m, idx }))
        .filter(({ year, monthIndex }) => year < currentYear || (year === currentYear && monthIndex < currentMonthIdx))
        .map(({ idx }) => idx);

    const futureIndices = activeMonths
        .map((m, idx) => ({ ...m, idx }))
        .filter(({ year, monthIndex }) => year > currentYear || (year === currentYear && monthIndex >= currentMonthIdx))
        .map(({ idx }) => idx);

    const remainingTarget = Math.max(0, totalTarget - currentValue);
    const futureTargets = weightedSplit(remainingTarget, futureIndices.map(i => allWeights[i]));

    const pastWeightTotal = pastIndices.reduce((sum, i) => sum + allWeights[i], 0);
    const futureWeightTotal = futureIndices.reduce((sum, i) => sum + allWeights[i], 0);
    const allWeightTotal = pastWeightTotal + futureWeightTotal;
    const pastTargetBudget = allWeightTotal > 0 ? (totalTarget * pastWeightTotal) / allWeightTotal : 0;
    const pastTargets = weightedSplit(pastTargetBudget, pastIndices.map(i => allWeights[i]));

    const targetByIndex = new Map<number, number>();
    pastIndices.forEach((i, pos) => targetByIndex.set(i, pastTargets[pos] ?? 0));
    futureIndices.forEach((i, pos) => targetByIndex.set(i, futureTargets[pos] ?? 0));

    return activeMonths.map((m, idx) => ({
        year: m.year,
        month: m.month,
        target: Math.round((targetByIndex.get(idx) ?? 0) * 100) / 100,
        actual: null,
        variance: null,
    }));
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

    const isCustomDistribution = formData.targetDistribution === 'custom';

    const updateCustomMonthlyTargets = (nextMonthlyData: MonthlyKPIData[]) => {
        const normalizedMonthlyData = nextMonthlyData.map((row) => ({
            ...row,
            target: Math.round((Number.isFinite(row.target) ? row.target : 0) * 100) / 100,
        }));

        setFormData((prev) => ({
            ...prev,
            monthlyData: normalizedMonthlyData,
            targetValue: sumMonthlyTargets(normalizedMonthlyData),
        }));
    };

    const handleDistributionChange = (distribution: TargetDistribution) => {
        if (distribution === 'custom') {
            setFormData((prev) => {
                const monthlyData = buildCustomMonthlyTargets(
                    prev.startDate || '',
                    prev.endDate || '',
                    prev.targetValue,
                    prev.monthlyData,
                );

                return {
                    ...prev,
                    targetDistribution: distribution,
                    monthlyData,
                    targetValue: sumMonthlyTargets(monthlyData),
                };
            });
            return;
        }

        setFormData((prev) => ({
            ...prev,
            targetDistribution: distribution,
        }));
    };

    const handleRangeChange = (field: 'startDate' | 'endDate', value: string) => {
        setFormData((prev) => {
            const nextFormData = { ...prev, [field]: value };

            if (prev.targetDistribution !== 'custom') {
                return nextFormData;
            }

            const monthlyData = buildCustomMonthlyTargets(
                field === 'startDate' ? value : prev.startDate || '',
                field === 'endDate' ? value : prev.endDate || '',
                prev.targetValue,
                prev.monthlyData,
            );

            return {
                ...nextFormData,
                monthlyData,
                targetValue: sumMonthlyTargets(monthlyData),
            };
        });
    };

    // Whenever target, dates or distribution changes, preview the monthly split
    const previewMonthly = isCustomDistribution
        ? formData.monthlyData
        : computeDistributedTargets(
            formData.targetValue,
            formData.startDate || '',
            formData.endDate || '',
            formData.targetDistribution || 'equal',
            formData.currentValue,
        );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 

        let monthlyData: MonthlyKPIData[] = [];

        if (formData.targetDistribution === 'custom') {
            monthlyData = formData.monthlyData.map((row) => ({
                ...row,
                target: Math.round((Number.isFinite(row.target) ? row.target : 0) * 100) / 100,
                actual: row.actual ?? null,
                variance: row.variance ?? null,
            }));
        } else {
            // Check if target calculation parameters changed
            const targetParamsChanged =
                !initialData ||
                initialData.targetValue !== formData.targetValue ||
                initialData.startDate !== formData.startDate ||
                initialData.endDate !== formData.endDate ||
                initialData.targetDistribution !== formData.targetDistribution;

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
                    (initialData?.monthlyData ?? []).map((m) => [getMonthlyRowKey(m.year, m.month), m])
                );
                monthlyData = distributedTargets.map((m) => {
                    const existing = existingByMonth.get(getMonthlyRowKey(m.year, m.month)) ?? existingByMonth.get(m.month);
                    return {
                        ...m,
                        actual: existing?.actual ?? m.actual,
                        variance: existing?.variance ?? m.variance,
                        year: existing?.year ?? m.year,
                    };
                });
            } else {
                // Target parameters didn't change, preserve all existing monthly data
                monthlyData = initialData?.monthlyData ?? [];
            }
        }
        
        // Calculate health and trend automatically from monthly data
        const lowerBetter = isLowerBetter(formData.unit, formData.code);
        const normalizedTargetValue = formData.targetDistribution === 'custom'
            ? sumMonthlyTargets(monthlyData)
            : formData.targetValue;
        const calculatedHealth = deriveHealth(monthlyData, undefined, lowerBetter, normalizedTargetValue);
        const calculatedTrend = deriveTrend(monthlyData, lowerBetter);
        
        const kpiWithMonthly: KPI = {
            ...formData,
            targetValue: normalizedTargetValue,
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
                    readOnly={isCustomDistribution}
                    required
                />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="Start Date"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => handleRangeChange('startDate', e.target.value)}
                    required
                />
                <FormInput
                    label="End Date"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => handleRangeChange('endDate', e.target.value)}
                    required
                />
            </div>

            {/* Distribution method */}
            <FormSelect
                label="Target Distribution Across Months"
                value={formData.targetDistribution || 'equal'}
                onChange={(e) => handleDistributionChange(e.target.value as TargetDistribution)}
                options={[
                    { value: 'equal', label: 'Equal — same target every active month' },
                    { value: 'linear', label: 'Linear ramp-up — increases each month' },
                    { value: 'front-loaded', label: 'Front-loaded — higher target in early months' },
                    { value: 'custom', label: 'Custom — set each month manually' },
                ]}
            />

            {/* Monthly target preview */}
            <div className="rounded-lg border border-slate-700 overflow-hidden">
                <div className="px-3 py-2 bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {isCustomDistribution ? 'Custom Monthly Targets' : 'Monthly Target Preview'}
                </div>
                {isCustomDistribution ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-slate-700">
                        {previewMonthly.map(({ month, target, year }) => (
                            <label key={getMonthlyRowKey(year, month)} className="flex flex-col gap-2 px-2 py-3 bg-slate-900 text-left">
                                <div>
                                    <span className="block text-[10px] text-slate-500 uppercase tracking-wide">{month}</span>
                                    {year && <span className="block text-[9px] text-slate-600">{year}</span>}
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={target}
                                    onChange={(e) => {
                                        const nextTarget = parseFloat(e.target.value) || 0;
                                        updateCustomMonthlyTargets(
                                            formData.monthlyData.map((row) =>
                                                getMonthlyRowKey(row.year, row.month) === getMonthlyRowKey(year, month)
                                                    ? { ...row, target: nextTarget }
                                                    : row
                                            ),
                                        );
                                    }}
                                    className="w-full px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </label>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-6 gap-px bg-slate-700">
                        {previewMonthly.map(({ month, target, year }) => (
                            <div key={`${year ?? ''}-${month}`} className="flex flex-col items-center px-1 py-2 bg-slate-900 text-center">
                                <span className="text-[10px] text-slate-500 mb-0.5">{month}</span>
                                {year && <span className="text-[9px] text-slate-600 mb-0.5">{year}</span>}
                                <span className={`text-xs font-semibold ${target > 0 ? 'text-blue-300' : 'text-slate-600'}`}>
                                    {target > 0 ? target : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                {isCustomDistribution && (
                    <div className="px-3 py-2 bg-slate-800/60 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between gap-3">
                        <span>Annual target updates automatically from the monthly values.</span>
                        <span className="font-semibold text-slate-200">Total: {formData.targetValue}</span>
                    </div>
                )}
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
                        className={dangerActionClass}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className={secondaryActionClass}>Cancel</button>
                    <button type="submit" disabled={isLoading} className={primaryActionClass}>
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
                        className={dangerActionClass}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={onCancel} className={secondaryActionClass}>Cancel</button>
                    <button type="submit" disabled={isLoading} className={primaryActionClass}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initialData ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </form>
    );
}
