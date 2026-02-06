'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { LongTermObjective, AnnualObjective, Initiative, KPI, Owner, HealthStatus, ResponsibilityType, Trend } from '@/lib/types';
import { generateId } from '@/lib/utils';

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
export function FormInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
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
export function FormSelect({ label, options, ...props }: { label: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
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
export function FormTextarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
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
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'critical' | 'high' | 'medium' | 'low' })}
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

// KPI Form
export function KPIForm({
    initialData,
    existingItems,
    onSubmit,
    onDelete,
    onCancel,
    isLoading
}: {
    initialData?: KPI;
    existingItems?: KPI[];
    onSubmit: (data: KPI) => void;
    onDelete?: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
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
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Code" placeholder="K-1" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                <FormInput label="Unit" placeholder="%" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required />
            </div>
            <FormInput label="Title" placeholder="Enterprise Win Rate" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Current Value" type="number" step="0.01" value={formData.currentValue} onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })} required />
                <FormInput label="Target Value" type="number" step="0.01" value={formData.targetValue} onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })} required />
            </div>
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
