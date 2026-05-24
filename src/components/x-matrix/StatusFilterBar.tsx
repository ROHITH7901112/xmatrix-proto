'use client';

import { useXMatrixStore } from '@/lib/store';
import { useTheme } from '@/components/providers/ThemeProvider';
import { EntityStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LayoutGrid, CheckCircle2, Filter } from 'lucide-react';

const TABS: { value: EntityStatus | 'all'; label: string; Icon: React.ElementType }[] = [
  { value: 'all',      label: 'All',      Icon: LayoutGrid },
  { value: 'active',   label: 'Active',   Icon: Filter },
  { value: 'done',     label: 'Done',     Icon: CheckCircle2 },
];

export function StatusFilterBar() {
  const { filterState, setStatusFilter, editModeState } = useXMatrixStore();
  const { colors } = useTheme();
  const { statusFilter } = filterState;
  const isEditMode = editModeState.mode === 'edit';

  return (
    <div className={cn('flex items-center gap-1 px-4 py-1.5 border-b', colors.border.light)}>
      <span className={cn('text-[10px] uppercase tracking-widest font-semibold mr-2', colors.text.tertiary)}>
        View
      </span>
      {TABS.map(({ value, label, Icon }) => {
        const active = statusFilter === value;
        return (
          <button
            key={value}
            onClick={() => !isEditMode && setStatusFilter(value)}
            disabled={isEditMode}
            title={isEditMode ? 'Filter disabled in edit mode — all items shown' : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
              active
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : cn('border border-transparent', colors.text.secondary, 'hover:bg-slate-700/50 hover:text-white'),
              isEditMode && 'opacity-40 cursor-not-allowed',
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        );
      })}
      {isEditMode && (
        <span className={cn('ml-2 text-[10px] italic', colors.text.tertiary)}>
          All items visible in edit mode
        </span>
      )}
    </div>
  );
}
