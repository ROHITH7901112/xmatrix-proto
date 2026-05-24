'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Target,
    Calendar,
    Rocket,
    BarChart3,
    Users,
    CheckCircle,
    AlertTriangle,
    XCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    Save,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type HealthStatus = 'on-track' | 'at-risk' | 'off-track';
type Priority = 'critical' | 'high' | 'medium' | 'low';
type Trend = 'up' | 'down' | 'stable';
type ResponsibilityType = 'accountable' | 'responsible' | 'consulted' | 'informed';
type TargetDistribution = 'equal' | 'linear' | 'front-loaded' | 'custom';

const KPI_UNITS = [
  { value: '%', label: '% — Percentage' },
  { value: '$', label: '$ — US Dollar' },
  { value: '₹', label: '₹ — Indian Rupee' },
  { value: '€', label: '€ — Euro' },
  { value: '£', label: '£ — British Pound' },
  { value: '¥', label: '¥ — Japanese Yen' },
  { value: '#', label: '# — Count / Units' },
  { value: 'hrs', label: 'hrs — Hours' },
  { value: 'days', label: 'days — Days' },
  { value: 'pts', label: 'pts — Points' },
  { value: 'x', label: 'x — Multiplier / Ratio' },
  { value: 'NPS', label: 'NPS — Net Promoter Score' },
  { value: 'custom', label: 'custom — Other' },
];

interface LongTermObjective {
    id: string;
    code: string;
    title: string;
    description: string;
    timeframe: string;
    health: HealthStatus;
}

interface AnnualObjective {
    id: string;
    code: string;
    title: string;
    description: string;
    year: number;
    health: HealthStatus;
    progress: number;
}

interface Initiative {
    id: string;
    code: string;
    title: string;
    description: string;
    priority: Priority;
    health: HealthStatus;
    status?: 'active' | 'done';
    startDate: string;
    endDate: string;
}

interface KPI {
    id: string;
    code: string;
    title: string;
    unit: string;
    currentValue: number;
    targetValue: number;
    health: HealthStatus;
    trend: Trend;
    ownerIds: string[];
    monthlyData: { year?: number; month: string; target: number; actual: number | null; variance: number | null }[];
    startDate?: string;
    endDate?: string;
    targetDistribution?: TargetDistribution;
}

interface Owner {
    id: string;
    name: string;
    role: string;
    avatar: string;
    initials: string;
    responsibilityType: ResponsibilityType;
}

interface XMatrixRelationship {
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    strength: string;
}

interface XMatrixData {
    id: string;
    name: string;
    vision: string;
    trueNorth: string;
    periodStart: number;
    periodEnd: number;
    themes: string[];
    longTermObjectives: LongTermObjective[];
    annualObjectives: AnnualObjective[];
    initiatives: Initiative[];
    kpis: KPI[];
    owners: Owner[];
    relationships?: XMatrixRelationship[];
}

function computeAOProgress(aoId: string, data: XMatrixData | null): { pct: number; done: number; total: number } {
    if (!data?.relationships) return { pct: 0, done: 0, total: 0 };
    const relatedInitIds = data.relationships
        .filter(r => r.strength !== 'none')
        .filter(r =>
            (r.sourceType === 'ao' && r.sourceId === aoId && r.targetType === 'initiative') ||
            (r.targetType === 'ao' && r.targetId === aoId && r.sourceType === 'initiative')
        )
        .map(r => r.sourceType === 'ao' && r.sourceId === aoId ? r.targetId : r.sourceId);
    const linked = data.initiatives.filter(i => relatedInitIds.includes(i.id));
    if (linked.length === 0) return { pct: 0, done: 0, total: 0 };
    const done = linked.filter(i => i.status === 'done').length;
    return { pct: Math.round((done / linked.length) * 100), done, total: linked.length };
}

type EntityType = 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';

// Generate unique ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

// Health status badge
function HealthBadge({ health }: { health: HealthStatus }) {
    const config = {
        'on-track': { icon: CheckCircle, color: 'text-emerald-400 bg-emerald-400/10', label: 'On Track' },
        'at-risk': { icon: AlertTriangle, color: 'text-amber-400 bg-amber-400/10', label: 'At Risk' },
        'off-track': { icon: XCircle, color: 'text-red-400 bg-red-400/10', label: 'Off Track' },
    };
    const { icon: Icon, color, label } = config[health];
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', color)}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

// Priority badge
function PriorityBadge({ priority }: { priority: Priority }) {
    const colors = {
        critical: 'text-red-400 bg-red-400/10',
        high: 'text-orange-400 bg-orange-400/10',
        medium: 'text-blue-400 bg-blue-400/10',
        low: 'text-slate-400 bg-slate-400/10',
    };
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', colors[priority])}>
            {priority}
        </span>
    );
}

// Trend icon
function TrendIcon({ trend }: { trend: Trend }) {
    const config = {
        up: { icon: TrendingUp, color: 'text-emerald-400' },
        down: { icon: TrendingDown, color: 'text-red-400' },
        stable: { icon: Minus, color: 'text-slate-400' },
    };
    const { icon: Icon, color } = config[trend];
    return <Icon className={cn('w-4 h-4', color)} />;
}

// Modal component
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                        <h2 className="text-lg font-semibold text-white">{title}</h2>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6">{children}</div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Form input component
function FormInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">{label}</label>
            <input
                {...props}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
        </div>
    );
}

// Form select component
function FormSelect({ label, options, ...props }: { label: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">{label}</label>
            <select
                {...props}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

// Form textarea component
function FormTextarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">{label}</label>
            <textarea
                {...props}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={3}
            />
        </div>
    );
}

// Entity card component
function EntityCard({
    children,
    onEdit,
    onDelete
}: {
    children: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="group relative p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-all"
        >
            {children}
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white transition-all"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

// Add button component
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold shadow-lg shadow-blue-500/30 ring-1 ring-white/10 hover:from-blue-400 hover:to-violet-500 hover:shadow-blue-500/40 transition-all"
        >
            <Plus className="w-4 h-4" />
            {label}
        </button>
    );
}

// Section header
function SectionHeader({ icon: Icon, title, count, onAdd, addLabel }: { icon: React.ElementType; title: string; count: number; onAdd: () => void; addLabel: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30">
                    <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="text-sm text-slate-400">{count} items</p>
                </div>
            </div>
            <AddButton label={addLabel} onClick={onAdd} />
        </div>
    );
}

// LTO Form
function LTOForm({
    initialData,
    existingItems,
    onSubmit,
    onCancel,
    isLoading
}: {
    initialData?: LongTermObjective;
    existingItems?: LongTermObjective[];
    onSubmit: (data: LongTermObjective) => void;
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
                label="Health Status"
                value={formData.health}
                onChange={(e) => setFormData({ ...formData, health: e.target.value as HealthStatus })}
                options={[
                    { value: 'on-track', label: 'On Track' },
                    { value: 'at-risk', label: 'At Risk' },
                    { value: 'off-track', label: 'Off Track' },
                ]}
            />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {initialData ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}

// AO Form
function AOForm({
    initialData,
    existingItems,
    onSubmit,
    onCancel,
    isLoading
}: {
    initialData?: AnnualObjective;
    existingItems?: AnnualObjective[];
    onSubmit: (data: AnnualObjective) => void;
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
            <FormSelect
                label="Health Status"
                value={formData.health}
                onChange={(e) => setFormData({ ...formData, health: e.target.value as HealthStatus })}
                options={[
                    { value: 'on-track', label: 'On Track' },
                    { value: 'at-risk', label: 'At Risk' },
                    { value: 'off-track', label: 'Off Track' },
                ]}
            />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {initialData ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}

// Initiative Form
function InitiativeForm({
    initialData,
    existingItems,
    onSubmit,
    onCancel,
    isLoading
}: {
    initialData?: Initiative;
    existingItems?: Initiative[];
    onSubmit: (data: Initiative) => void;
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
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    options={[
                        { value: 'critical', label: 'Critical' },
                        { value: 'high', label: 'High' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'low', label: 'Low' },
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
                label="Health Status"
                value={formData.health}
                onChange={(e) => setFormData({ ...formData, health: e.target.value as HealthStatus })}
                options={[
                    { value: 'on-track', label: 'On Track' },
                    { value: 'at-risk', label: 'At Risk' },
                    { value: 'off-track', label: 'Off Track' },
                ]}
            />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {initialData ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}

// KPI Form
// ========== Target distribution helper ==========
const ALL_MONTHS_BC = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function computeDistributedTargets(
    totalTarget: number,
    startDate: string,
    endDate: string,
    distribution: TargetDistribution,
    currentValue: number = 0,
): { year?: number; month: string; target: number; actual: number | null; variance: null }[] {
    if (!startDate || !endDate) {
        const perMonth = totalTarget / 12;
        return ALL_MONTHS_BC.map(month => ({ month, target: Math.round(perMonth * 100) / 100, actual: null, variance: null }));
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const activeIndices: number[] = [];
    for (let i = 0; i < 12; i++) {
        const monthDate = new Date(start.getFullYear(), i, 1);
        const monthEnd = new Date(start.getFullYear(), i + 1, 0);
        if (monthEnd >= start && monthDate <= end) activeIndices.push(i);
    }
    if (activeIndices.length === 0) {
        return ALL_MONTHS_BC.map(month => ({ month, target: 0, actual: null, variance: null }));
    }
    const n = activeIndices.length;
    let weights: number[];
    switch (distribution) {
        case 'linear': weights = activeIndices.map((_, idx) => idx + 1); break;
        case 'front-loaded': weights = activeIndices.map((_, idx) => n - idx); break;
        default: weights = activeIndices.map(() => 1);
    }
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    // Split active months into past (already happened) and future (from today onwards)
    // Past months: get reference targets; actuals left null for manual entry
    // Future months: only carry the REMAINING target (totalTarget - currentValue)
    const now = new Date();
    const currentMonthIdx = now.getMonth(); // 0=Jan, 1=Feb, ... 11=Dec

    const pastActiveIndices = activeIndices.filter(idx => idx < currentMonthIdx);
    const futureActiveIndices = activeIndices.filter(idx => idx >= currentMonthIdx);

    const remainingTarget = Math.max(0, totalTarget - currentValue);

    // Weights for future months (distribute remaining target)
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
    const futureDiff = remainingTarget - futureTargets.reduce((a, b) => a + b, 0);
    if (futureTargets.length > 0) {
      futureTargets[futureTargets.length - 1] = Math.round((futureTargets[futureTargets.length - 1] + futureDiff) * 100) / 100;
    }

    // Weights for past months (share of total target, reference only)
    const pastWeightsArr = pastActiveIndices.map((_, i) => {
      const posInAll = activeIndices.indexOf(pastActiveIndices[i]);
      if (distribution === 'linear') return posInAll + 1;
      if (distribution === 'front-loaded') return n - posInAll;
      return 1;
    });
    const pastTotalWeight2 = pastWeightsArr.reduce((a, b) => a + b, 0) || 1;
    const pastTargets = pastWeightsArr.map(w =>
      Math.round((totalTarget * w / (pastTotalWeight2 + futureTotalWeight)) * 100) / 100
    );

    const targetMap = new Map<number, number>();
    pastActiveIndices.forEach((mi, i) => targetMap.set(mi, pastTargets[i] ?? 0));
    futureActiveIndices.forEach((mi, i) => targetMap.set(mi, futureTargets[i] ?? 0));
    return ALL_MONTHS_BC.map((month, idx) => ({
        month,
        target: targetMap.get(idx) ?? 0,
        actual: null, // Always null — user enters actuals manually in the Bowling Chart
        variance: null,
    }));
}

const getMonthlyRowKey = (year: number | undefined, month: string) => `${year ?? ''}-${month}`;

const sumMonthlyTargets = (monthlyData: { target: number }[]) =>
    Math.round(monthlyData.reduce((sum, row) => sum + (Number.isFinite(row.target) ? row.target : 0), 0) * 100) / 100;

const buildCustomMonthlyTargets = (
    startDate: string,
    endDate: string,
    totalTarget: number,
    existingMonthlyData: { year?: number; month: string; target: number; actual: number | null; variance: number | null }[] = [],
) => {
    if (!startDate || !endDate) {
        const baseYear = new Date().getFullYear();
        const fallbackTarget = Math.round((totalTarget / 12) * 100) / 100;
        return ALL_MONTHS_BC.map((month) => ({ year: baseYear, month, target: fallbackTarget, actual: null, variance: null }));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const activeMonths: { year: number; month: string; monthIndex: number }[] = [];

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
        const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cursor <= endCursor && activeMonths.length < 60) {
            activeMonths.push({
                year: cursor.getFullYear(),
                month: ALL_MONTHS_BC[cursor.getMonth()],
                monthIndex: cursor.getMonth(),
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
    }

    if (activeMonths.length === 0) {
        const baseYear = new Date().getFullYear();
        const fallbackTarget = Math.round((totalTarget / 12) * 100) / 100;
        return ALL_MONTHS_BC.map((month) => ({ year: baseYear, month, target: fallbackTarget, actual: null, variance: null }));
    }

    const existingByKey = new Map<string, { year?: number; month: string; target: number; actual: number | null; variance: number | null }>();
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

// KPI Form
function KPIForm({
    initialData,
    existingItems,
    onSubmit,
    onCancel,
    isLoading
}: {
    initialData?: KPI;
    existingItems?: KPI[];
    onSubmit: (data: KPI & { monthlyData: { month: string; target: number; actual: number | null; variance: null }[] }) => void;
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

    const updateCustomMonthlyTargets = (nextMonthlyData: { year?: number; month: string; target: number; actual: number | null; variance: number | null }[]) => {
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

        let monthlyData: { year?: number; month: string; target: number; actual: number | null; variance: null }[];

        if (formData.targetDistribution === 'custom') {
            monthlyData = formData.monthlyData.map((m) => ({
                ...m,
                target: Math.round((Number.isFinite(m.target) ? m.target : 0) * 100) / 100,
                actual: m.actual ?? null,
                variance: null,
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
                        variance: null,
                    };
                });
            } else {
                // Target parameters didn't change, preserve all existing monthly data (but normalize variance to null)
                monthlyData = (initialData?.monthlyData ?? []).map((m) => ({
                    ...m,
                    variance: null,
                }));
            }
        }

        const normalizedTargetValue = formData.targetDistribution === 'custom'
            ? sumMonthlyTargets(monthlyData)
            : formData.targetValue;

        onSubmit({
            ...formData,
            targetValue: normalizedTargetValue,
            monthlyData,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Code" placeholder="K-1" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                {/* Unit dropdown */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Unit</label>
                    <select
                        value={KPI_UNITS.some(u => u.value === formData.unit) ? formData.unit : 'custom'}
                        onChange={(e) => {
                            if (e.target.value === 'custom') setFormData({ ...formData, unit: '' });
                            else setFormData({ ...formData, unit: e.target.value });
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        {KPI_UNITS.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                    </select>
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
            <FormInput label="Title" placeholder="Enterprise Win Rate" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Current Value" type="number" step="0.01" value={formData.currentValue} onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })} required />
                <FormInput label={`Annual Target (${formData.unit || '?'})`} type="number" step="0.01" value={formData.targetValue} onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })} readOnly={isCustomDistribution} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Start Date" type="date" value={formData.startDate || ''} onChange={(e) => handleRangeChange('startDate', e.target.value)} required />
                <FormInput label="End Date" type="date" value={formData.endDate || ''} onChange={(e) => handleRangeChange('endDate', e.target.value)} required />
            </div>
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
            {/* Monthly preview */}
            <div className="rounded-lg border border-slate-700 overflow-hidden">
                <div className="px-3 py-2 bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wide">{isCustomDistribution ? 'Custom Monthly Targets' : 'Monthly Target Preview'}</div>
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
                        {previewMonthly.map(({ month, target }) => (
                            <div key={month} className="flex flex-col items-center px-1 py-2 bg-slate-900 text-center">
                                <span className="text-[10px] text-slate-500 mb-0.5">{month}</span>
                                <span className={`text-xs font-semibold ${target > 0 ? 'text-blue-300' : 'text-slate-600'}`}>{target > 0 ? target : '—'}</span>
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
            <div className="grid grid-cols-2 gap-4">
                <FormSelect
                    label="Health Status"
                    value={formData.health}
                    onChange={(e) => setFormData({ ...formData, health: e.target.value as HealthStatus })}
                    options={[
                        { value: 'on-track', label: 'On Track' },
                        { value: 'at-risk', label: 'At Risk' },
                        { value: 'off-track', label: 'Off Track' },
                    ]}
                />
                <FormSelect
                    label="Trend"
                    value={formData.trend}
                    onChange={(e) => setFormData({ ...formData, trend: e.target.value as Trend })}
                    options={[
                        { value: 'up', label: 'Trending Up' },
                        { value: 'down', label: 'Trending Down' },
                        { value: 'stable', label: 'Stable' },
                    ]}
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {initialData ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}

// Owner Form
function OwnerForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading
}: {
    initialData?: Owner;
    onSubmit: (data: Owner) => void;
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
            <FormInput label="Role" placeholder="Chief Strategy Officer" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required />
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
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {initialData ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}

// Main page component
export default function ManagePage() {
    const [data, setData] = useState<XMatrixData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [modalType, setModalType] = useState<EntityType | null>(null);
    const [editingItem, setEditingItem] = useState<LongTermObjective | AnnualObjective | Initiative | KPI | Owner | null>(null);

    // Active tab
    const [activeTab, setActiveTab] = useState<EntityType>('lto');

    const XMATRIX_ID = 'xmatrix-main';

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/xmatrix');
            const matrices = await response.json();

            if (matrices.length > 0) {
                setData(matrices[0]);
            } else {
                // Create a default XMatrix if none exists
                const createResponse = await fetch('/api/xmatrix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: XMATRIX_ID,
                        name: 'Strategy 2026',
                        vision: 'Your company vision',
                        trueNorth: 'Your true north',
                        periodStart: 2026,
                        periodEnd: 2028,
                        themes: [],
                    }),
                });
                const newMatrix = await createResponse.json();
                setData(newMatrix);
            }
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // CRUD handlers for LTO
    const handleCreateLTO = async (lto: LongTermObjective) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/objectives/long-term', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...lto }),
            });
            await fetchData();
            setModalType(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateLTO = async (lto: LongTermObjective) => {
        setIsSaving(true);
        try {
            await fetch(`/api/objectives/long-term/${lto.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lto),
            });
            await fetchData();
            setModalType(null);
            setEditingItem(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLTO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        try {
            await fetch(`/api/objectives/long-term/${id}`, { method: 'DELETE' });
            await fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD handlers for AO
    const handleCreateAO = async (ao: AnnualObjective) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/objectives/annual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...ao }),
            });
            await fetchData();
            setModalType(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAO = async (ao: AnnualObjective) => {
        setIsSaving(true);
        try {
            await fetch(`/api/objectives/annual/${ao.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ao),
            });
            await fetchData();
            setModalType(null);
            setEditingItem(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        try {
            await fetch(`/api/objectives/annual/${id}`, { method: 'DELETE' });
            await fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD handlers for Initiative
    const handleCreateInitiative = async (initiative: Initiative) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/initiatives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...initiative }),
            });
            await fetchData();
            setModalType(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateInitiative = async (initiative: Initiative) => {
        setIsSaving(true);
        try {
            await fetch(`/api/initiatives/${initiative.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initiative),
            });
            await fetchData();
            setModalType(null);
            setEditingItem(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInitiative = async (id: string) => {
        if (!confirm('Are you sure you want to delete this initiative?')) return;
        try {
            await fetch(`/api/initiatives/${id}`, { method: 'DELETE' });
            await fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD handlers for KPI
    const handleCreateKPI = async (kpi: KPI & { monthlyData?: { month: string; target: number; actual: number | null; variance: null }[] }) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/kpis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...kpi }),
            });
            await fetchData();
            setModalType(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateKPI = async (kpi: KPI) => {
        setIsSaving(true);
        try {
            await fetch(`/api/kpis/${kpi.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kpi),
            });
            await fetchData();
            setModalType(null);
            setEditingItem(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteKPI = async (id: string) => {
        if (!confirm('Are you sure you want to delete this KPI?')) return;
        try {
            await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
            await fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD handlers for Owner
    const handleCreateOwner = async (owner: Owner) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/owners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...owner }),
            });
            await fetchData();
            setModalType(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateOwner = async (owner: Owner) => {
        setIsSaving(true);
        try {
            await fetch(`/api/owners/${owner.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(owner),
            });
            await fetchData();
            setModalType(null);
            setEditingItem(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOwner = async (id: string) => {
        if (!confirm('Are you sure you want to delete this owner?')) return;
        try {
            await fetch(`/api/owners/${id}`, { method: 'DELETE' });
            await fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const openAddModal = (type: EntityType) => {
        setEditingItem(null);
        setModalType(type);
    };

    const openEditModal = (type: EntityType, item: LongTermObjective | AnnualObjective | Initiative | KPI | Owner) => {
        setEditingItem(item);
        setModalType(type);
    };

    const closeModal = () => {
        setModalType(null);
        setEditingItem(null);
    };

    const tabs = [
        { id: 'lto' as EntityType, label: 'Long-Term Objectives', icon: Target },
        { id: 'ao' as EntityType, label: 'Annual Objectives', icon: Calendar },
        { id: 'initiative' as EntityType, label: 'Initiatives', icon: Rocket },
        { id: 'kpi' as EntityType, label: 'KPIs', icon: BarChart3 },
        { id: 'owner' as EntityType, label: 'Owners', icon: Users },
    ];

    if (isLoading) {
        return (
            <DashboardLayout title="Manage">
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Manage">
                <div className="flex items-center justify-center h-full text-red-400">
                    {error}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Manage">
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Manage X-Matrix Data</h1>
                    <p className="text-slate-400">Create and manage your objectives, initiatives, KPIs, and team members.</p>
                </div>

                

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap',
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {/* LTO Tab */}
                    {activeTab === 'lto' && (
                        <motion.div key="lto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SectionHeader icon={Target} title="Long-Term Objectives" count={data?.longTermObjectives.length || 0} onAdd={() => openAddModal('lto')} addLabel="Add LTO" />
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <AnimatePresence>
                                    {data?.longTermObjectives.map((lto) => (
                                        <EntityCard key={lto.id} onEdit={() => openEditModal('lto', lto)} onDelete={() => handleDeleteLTO(lto.id)}>
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs font-mono text-blue-400">{lto.code}</span>
                                                <HealthBadge health={lto.health} />
                                            </div>
                                            <h3 className="font-semibold text-white mb-1">{lto.title}</h3>
                                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">{lto.description}</p>
                                            <span className="text-xs text-slate-500">{lto.timeframe}</span>
                                        </EntityCard>
                                    ))}
                                </AnimatePresence>
                                {data?.longTermObjectives.length === 0 && (
                                    <div className="col-span-2 py-16 flex flex-col items-center gap-3 text-center">
                                        <p className="text-slate-400 text-sm">No long-term objectives yet.</p>
                                        <button onClick={() => openAddModal('lto')} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">+ Add Long-Term Objective</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* AO Tab */}
                    {activeTab === 'ao' && (
                        <motion.div key="ao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SectionHeader icon={Calendar} title="Annual Objectives" count={data?.annualObjectives.length || 0} onAdd={() => openAddModal('ao')} addLabel="Add AO" />
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <AnimatePresence>
                                    {data?.annualObjectives.map((ao) => (
                                        <EntityCard key={ao.id} onEdit={() => openEditModal('ao', ao)} onDelete={() => handleDeleteAO(ao.id)}>
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs font-mono text-blue-400">{ao.code}</span>
                                                <HealthBadge health={ao.health} />
                                            </div>
                                            <h3 className="font-semibold text-white mb-1">{ao.title}</h3>
                                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">{ao.description}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">{ao.year}</span>
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const { pct, done, total } = computeAOProgress(ao.id, data);
                                                        return (
                                                            <>
                                                                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                                                                </div>
                                                                <span className="text-xs text-slate-400">
                                                                    {total > 0 ? `${done}/${total} done` : '0 linked'}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </EntityCard>
                                    ))}
                                </AnimatePresence>
                                {data?.annualObjectives.length === 0 && (
                                    <div className="col-span-2 py-16 flex flex-col items-center gap-3 text-center">
                                        <p className="text-slate-400 text-sm">No annual objectives yet.</p>
                                        <button onClick={() => openAddModal('ao')} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">+ Add Annual Objective</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Initiative Tab */}
                    {activeTab === 'initiative' && (
                        <motion.div key="initiative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SectionHeader icon={Rocket} title="Initiatives" count={data?.initiatives.length || 0} onAdd={() => openAddModal('initiative')} addLabel="Add Initiative" />
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <AnimatePresence>
                                    {data?.initiatives.map((initiative) => (
                                        <EntityCard key={initiative.id} onEdit={() => openEditModal('initiative', initiative)} onDelete={() => handleDeleteInitiative(initiative.id)}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-blue-400">{initiative.code}</span>
                                                    <PriorityBadge priority={initiative.priority} />
                                                </div>
                                                <HealthBadge health={initiative.health} />
                                            </div>
                                            <h3 className="font-semibold text-white mb-1">{initiative.title}</h3>
                                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">{initiative.description}</p>
                                            <span className="text-xs text-slate-500">{initiative.startDate} → {initiative.endDate}</span>
                                        </EntityCard>
                                    ))}
                                </AnimatePresence>
                                {data?.initiatives.length === 0 && (
                                    <div className="col-span-2 py-16 flex flex-col items-center gap-3 text-center">
                                        <p className="text-slate-400 text-sm">No initiatives yet.</p>
                                        <button onClick={() => openAddModal('initiative')} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">+ Add Initiative</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* KPI Tab */}
                    {activeTab === 'kpi' && (
                        <motion.div key="kpi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SectionHeader icon={BarChart3} title="KPIs" count={data?.kpis.length || 0} onAdd={() => openAddModal('kpi')} addLabel="Add KPI" />
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                <AnimatePresence>
                                    {data?.kpis.map((kpi) => (
                                        <EntityCard key={kpi.id} onEdit={() => openEditModal('kpi', kpi)} onDelete={() => handleDeleteKPI(kpi.id)}>
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs font-mono text-blue-400">{kpi.code}</span>
                                                <div className="flex items-center gap-2">
                                                    <TrendIcon trend={kpi.trend} />
                                                    <HealthBadge health={kpi.health} />
                                                </div>
                                            </div>
                                            <h3 className="font-semibold text-white mb-2">{kpi.title}</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-white">{kpi.currentValue}</span>
                                                <span className="text-slate-400">/ {kpi.targetValue} {kpi.unit}</span>
                                            </div>
                                        </EntityCard>
                                    ))}
                                </AnimatePresence>
                                {data?.kpis.length === 0 && (
                                    <div className="col-span-3 py-16 flex flex-col items-center gap-3 text-center">
                                        <p className="text-slate-400 text-sm">No KPIs yet.</p>
                                        <button onClick={() => openAddModal('kpi')} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">+ Add KPI</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Owner Tab */}
                    {activeTab === 'owner' && (
                        <motion.div key="owner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SectionHeader icon={Users} title="Owners / Team Members" count={data?.owners.length || 0} onAdd={() => openAddModal('owner')} addLabel="Add Owner" />
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                <AnimatePresence>
                                    {data?.owners.map((owner) => (
                                        <EntityCard key={owner.id} onEdit={() => openEditModal('owner', owner)} onDelete={() => handleDeleteOwner(owner.id)}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white font-semibold">
                                                    {owner.initials}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{owner.name}</h3>
                                                    <p className="text-sm text-slate-400">{owner.role}</p>
                                                    <span className="text-xs text-slate-500 capitalize">{owner.responsibilityType}</span>
                                                </div>
                                            </div>
                                        </EntityCard>
                                    ))}
                                </AnimatePresence>
                                {data?.owners.length === 0 && (
                                    <div className="col-span-3 py-16 flex flex-col items-center gap-3 text-center">
                                        <p className="text-slate-400 text-sm">No team members yet.</p>
                                        <button onClick={() => openAddModal('owner')} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">+ Add Team Member</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <Modal isOpen={modalType === 'lto'} onClose={closeModal} title={editingItem ? 'Edit Long-Term Objective' : 'Add Long-Term Objective'}>
                <LTOForm
                    initialData={editingItem as LongTermObjective | undefined}
                    existingItems={data?.longTermObjectives}
                    onSubmit={editingItem ? handleUpdateLTO : handleCreateLTO}
                    onCancel={closeModal}
                    isLoading={isSaving}
                />
            </Modal>

            <Modal isOpen={modalType === 'ao'} onClose={closeModal} title={editingItem ? 'Edit Annual Objective' : 'Add Annual Objective'}>
                <AOForm
                    initialData={editingItem as AnnualObjective | undefined}
                    existingItems={data?.annualObjectives}
                    onSubmit={editingItem ? handleUpdateAO : handleCreateAO}
                    onCancel={closeModal}
                    isLoading={isSaving}
                />
            </Modal>

            <Modal isOpen={modalType === 'initiative'} onClose={closeModal} title={editingItem ? 'Edit Initiative' : 'Add Initiative'}>
                <InitiativeForm
                    initialData={editingItem as Initiative | undefined}
                    existingItems={data?.initiatives}
                    onSubmit={editingItem ? handleUpdateInitiative : handleCreateInitiative}
                    onCancel={closeModal}
                    isLoading={isSaving}
                />
            </Modal>

            <Modal isOpen={modalType === 'kpi'} onClose={closeModal} title={editingItem ? 'Edit KPI' : 'Add KPI'}>
                <KPIForm
                    initialData={editingItem as KPI | undefined}
                    existingItems={data?.kpis}
                    onSubmit={editingItem ? handleUpdateKPI : handleCreateKPI}
                    onCancel={closeModal}
                    isLoading={isSaving}
                />
            </Modal>

            <Modal isOpen={modalType === 'owner'} onClose={closeModal} title={editingItem ? 'Edit Owner' : 'Add Owner'}>
                <OwnerForm
                    initialData={editingItem as Owner | undefined}
                    onSubmit={editingItem ? handleUpdateOwner : handleCreateOwner}
                    onCancel={closeModal}
                    isLoading={isSaving}
                />
            </Modal>
        </DashboardLayout>
    );
}
