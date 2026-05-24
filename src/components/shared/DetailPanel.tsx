'use client';

import { useState } from 'react';
import { useXMatrixStore } from '@/lib/store';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn, getHealthClass, getStatusLabel } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ExternalLink, Users, Target, Rocket, BarChart3,
  CheckCircle2, AlertTriangle, AlertCircle, Activity,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { Initiative, LongTermObjective, AnnualObjective, Owner, EntityStatus } from '@/lib/types';
import { getEffectiveInitiativeStatus } from '@/lib/status-cascade';

// ── Status badge helper ────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: EntityStatus }) {
  const cfg: Record<EntityStatus, { label: string; cls: string }> = {
    active:   { label: 'Active',   cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    done:     { label: 'Done',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  };
  const { label, cls } = cfg[status ?? 'active'];
  return (
    <span className={cn('shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-full border', cls)}>
      {label}
    </span>
  );
}

// ── Collapsible section ────────────────────────────────────────────────────
function Section({
  title, count, icon: Icon, iconCls, children, defaultOpen = true,
}: {
  title: string; count: number; icon: React.ElementType; iconCls: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn('w-full flex items-center gap-1.5 mb-2 group', colors.text.tertiary)}
      >
        <Icon className={cn('w-3.5 h-3.5', iconCls)} />
        <span className="text-xs font-semibold uppercase tracking-wider flex-1 text-left">
          {title} ({count})
        </span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          : <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </section>
  );
}

// ── Owner details modal ───────────────────────────────────────────────────
function OwnerDetailsModal({ owner, onClose }: { owner: Owner; onClose: () => void }) {
  const { data } = useXMatrixStore();
  const { colors } = useTheme();

  const ownerRelationships = data.relationships.filter(r => {
    if (r.strength === 'none') return false;
    return (r.sourceId === owner.id && r.targetType === 'initiative') ||
           (r.targetId === owner.id && r.sourceType === 'initiative');
  });

  const ownerInitiativeIds = new Set(ownerRelationships.map(r =>
    r.sourceType === 'initiative' ? r.sourceId : r.targetId
  ));

  const allOwnerInitiatives = data.initiatives.filter(i => ownerInitiativeIds.has(i.id));
  const effectiveStatus = (i: Initiative) =>
    getEffectiveInitiativeStatus(i, data.kpis, data.relationships);
  const activeInitiatives   = allOwnerInitiatives.filter(i => effectiveStatus(i) === 'active');
  const doneInitiatives     = allOwnerInitiatives.filter(i => effectiveStatus(i) === 'done');
  const ownerKPIs = data.kpis.filter(k => k.ownerIds.includes(owner.id));

  const totalCount = allOwnerInitiatives.length;
  const loadLevel = totalCount >= 5 ? 'critical' : totalCount >= 3 ? 'high' : 'normal';

  const loadConfig = {
    critical: { label: 'Overloaded',   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',       Icon: AlertCircle },
    high:     { label: 'Heavy Load',   color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',   Icon: AlertTriangle },
    normal:   { label: 'Normal Load',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', Icon: CheckCircle2 },
  }[loadLevel];

  const { Icon: LoadIcon } = loadConfig;

  const stats = [
    { label: 'Active',   value: activeInitiatives.length,   color: 'text-blue-400' },
    { label: 'Done',     value: doneInitiatives.length,     color: 'text-emerald-400' },
    { label: 'KPIs',     value: ownerKPIs.length,           color: 'text-orange-400' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className={cn('relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border flex flex-col', colors.card)}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn('flex items-start justify-between px-5 py-4 border-b', colors.border.light)}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white font-bold text-lg shrink-0">
                {owner.initials}
              </div>
              <div>
                <h2 className={cn('text-base font-semibold', colors.text.primary)}>{owner.name}</h2>
                <p className={cn('text-sm', colors.text.secondary)}>{owner.role}</p>
                <span className="mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 capitalize">
                  {owner.responsibilityType}
                </span>
              </div>
            </div>
            <button onClick={onClose} className={cn('p-1.5 rounded-lg transition-colors hover:bg-slate-700', colors.text.secondary)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats row */}
          <div className={cn('grid grid-cols-4 border-b', colors.border.light)}>
            {stats.map((stat, i) => (
              <div key={i} className={cn('flex flex-col items-center py-3', i < 3 && `border-r ${colors.border.light}`)}>
                <span className={cn('text-xl font-semibold', stat.color)}>{stat.value}</span>
                <span className={cn('text-[10px] mt-0.5', colors.text.tertiary)}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Load banner */}
          <div className={cn('mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium', loadConfig.bg, loadConfig.color)}>
            <LoadIcon className="w-3.5 h-3.5 shrink-0" />
            {loadLevel === 'critical' && `${totalCount} initiatives assigned — consider redistributing workload`}
            {loadLevel === 'high'     && `${totalCount} initiatives assigned — workload is elevated`}
            {loadLevel === 'normal'   && `${totalCount} initiative${totalCount !== 1 ? 's' : ''} assigned — workload is manageable`}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 pb-5 space-y-4 mt-3">

            {/* Active Initiatives */}
            {activeInitiatives.length > 0 && (
              <Section title="Active Initiatives" count={activeInitiatives.length} icon={Activity} iconCls="text-blue-400">
                {activeInitiatives.map(init => (
                  <InitiativeCard key={init.id} init={init} effectiveStatus="active" />
                ))}
              </Section>
            )}

            {/* Done Initiatives */}
            {doneInitiatives.length > 0 && (
              <Section title="Done" count={doneInitiatives.length} icon={CheckCircle2} iconCls="text-emerald-400" defaultOpen={false}>
                {doneInitiatives.map(init => (
                  <InitiativeCard key={init.id} init={init} effectiveStatus="done" dimmed />
                ))}
              </Section>
            )}


            {/* KPIs */}
            {ownerKPIs.length > 0 && (
              <Section title="KPIs Owned" count={ownerKPIs.length} icon={BarChart3} iconCls="text-orange-400">
                {ownerKPIs.map(kpi => {
                  const progress = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;
                  const reached = progress >= 100;
                  return (
                    <div key={kpi.id} className={cn('flex items-center gap-2.5 p-2.5 rounded-lg', 'bg-slate-800/50')}>
                      <BarChart3 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn('text-xs font-medium truncate', 'text-white')}>{kpi.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {reached && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Target Reached
                              </span>
                            )}
                            <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded-full border', getHealthClass(kpi.health))}>
                              {getStatusLabel(kpi.health)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', reached ? 'bg-emerald-500' : 'bg-blue-500')}
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                          <span className="text-[10px] shrink-0 text-slate-400">
                            {kpi.currentValue}/{kpi.targetValue} {kpi.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Section>
            )}

            {allOwnerInitiatives.length === 0 && ownerKPIs.length === 0 && (
              <div className="text-center py-10">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No assignments yet</p>
                <p className="text-xs mt-1 text-slate-500">Link initiatives to this owner in the X-Matrix</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InitiativeCard({ init, dimmed, effectiveStatus }: { init: Initiative; dimmed?: boolean; effectiveStatus?: EntityStatus }) {
  const { colors } = useTheme();
  const status = effectiveStatus ?? init.status;
  return (
    <div className={cn('flex items-start gap-2.5 p-2.5 rounded-lg', colors.bg.tertiary, dimmed && 'opacity-65')}>
      <Rocket className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', status === 'done' ? 'text-emerald-500' : 'text-blue-400')} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={cn('text-xs font-medium', colors.text.primary, dimmed && 'line-through')}>{init.title}</span>
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={status} />
            <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded-full border', getHealthClass(init.health))}>
              {getStatusLabel(init.health)}
            </span>
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 mt-0.5 text-[10px]', colors.text.tertiary)}>
          <span>{init.code}</span>
          {init.endDate && <span>· Due {init.endDate}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Main DetailPanel ──────────────────────────────────────────────────────
export function DetailPanel() {
  const { viewState, setSelectedElement, data } = useXMatrixStore();
  const { colors } = useTheme();
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);
  const { selectedElement } = viewState;

  if (!selectedElement) return null;

  const getElementData = () => {
    switch (selectedElement.type) {
      case 'lto':       return data.longTermObjectives.find((e) => e.id === selectedElement.id);
      case 'ao':        return data.annualObjectives.find((e) => e.id === selectedElement.id);
      case 'initiative': return data.initiatives.find((e) => e.id === selectedElement.id);
      case 'kpi':       return data.kpis.find((e) => e.id === selectedElement.id);
      case 'owner':     return data.owners.find((e) => e.id === selectedElement.id);
      default:          return null;
    }
  };

  const getTypeLabel = () => {
    switch (selectedElement.type) {
      case 'lto':        return 'Long-Term Objective';
      case 'ao':         return 'Annual Objective';
      case 'initiative': return 'Initiative';
      case 'kpi':        return 'KPI';
      case 'owner':      return 'Owner';
      default:           return '';
    }
  };

  const getTypeIcon = () => {
    switch (selectedElement.type) {
      case 'lto':        return Target;
      case 'ao':         return Target;
      case 'initiative': return Rocket;
      case 'kpi':        return BarChart3;
      case 'owner':      return Users;
      default:           return Target;
    }
  };

  const elementData = getElementData();
  if (!elementData) return null;

  const Icon = getTypeIcon();
  const health = 'health' in elementData ? elementData.health : null;
  const entityStatus: EntityStatus | undefined =
    'status' in elementData ? (elementData as { status?: EntityStatus }).status : undefined;

  return (
    <AnimatePresence>
      <motion.div
        key={`detail-${selectedElement.type}-${selectedElement.id}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={cn("fixed right-4 top-20 w-80 rounded-xl shadow-2xl z-50 overflow-hidden border", colors.card)}
      >
        {/* Header */}
        <div className={cn("flex items-center justify-between px-4 py-3 border-b", colors.border.light)}>
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg", colors.bg.tertiary)}>
              <Icon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className={cn("text-xs uppercase tracking-wider", colors.text.tertiary)}>
                {getTypeLabel()}
              </span>
              <span className={cn("text-sm font-semibold", colors.text.primary)}>
                {'code' in elementData ? elementData.code : 'name' in elementData ? elementData.name : ''}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedElement(null)}
            className={cn("p-1.5 rounded-lg transition-colors", colors.text.secondary, "hover:" + colors.text.primary, "hover:" + colors.bg.tertiary)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <h3 className={cn("text-base font-semibold mb-1", colors.text.primary)}>
              {'title' in elementData ? elementData.title : 'name' in elementData ? elementData.name : ''}
            </h3>
            {'description' in elementData && (
              <p className={cn("text-sm", colors.text.secondary)}>{elementData.description}</p>
            )}
          </div>

          {/* Health + Lifecycle status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {health && (
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', getHealthClass(health))}>
                {getStatusLabel(health)}
              </span>
            )}
            {entityStatus && <StatusBadge status={entityStatus} />}
          </div>

          {/* KPI-specific data */}
          {selectedElement.type === 'kpi' && 'currentValue' in elementData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Current</div>
                <div className="text-lg font-semibold text-white">
                  {elementData.currentValue}
                  <span className="text-sm text-slate-400 ml-1">{elementData.unit}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Target</div>
                <div className="text-lg font-semibold text-white">
                  {elementData.targetValue}
                  <span className="text-sm text-slate-400 ml-1">{elementData.unit}</span>
                </div>
              </div>
            </div>
          )}

          {/* Owner-specific data */}
          {selectedElement.type === 'owner' && 'role' in elementData && (() => {
            const owner = elementData as Owner;
            const ownerInits = data.initiatives.filter(i => {
              const rel = data.relationships.find(r =>
                r.strength !== 'none' && (
                  (r.sourceId === owner.id && r.targetId === i.id) ||
                  (r.targetId === owner.id && r.sourceId === i.id)
                )
              );
              return !!rel;
            });
            const effective = (i: Initiative) =>
              getEffectiveInitiativeStatus(i, data.kpis, data.relationships);
            const active = ownerInits.filter(i => effective(i) === 'active').length;
            const done   = ownerInits.filter(i => effective(i) === 'done').length;
            const ownerKPIs = data.kpis.filter(k => k.ownerIds.includes(owner.id));
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white font-semibold">
                    {owner.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{owner.name}</div>
                    <div className="text-xs text-slate-400">{owner.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Responsibility</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 capitalize">
                    {owner.responsibilityType}
                  </span>
                </div>
                {/* Quick summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                    <div className="text-base font-semibold text-blue-400">{active}</div>
                    <div className="text-[10px] text-slate-500">Active</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                    <div className="text-base font-semibold text-emerald-400">{done}</div>
                    <div className="text-[10px] text-slate-500">Done</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                    <div className="text-base font-semibold text-orange-400">{ownerKPIs.length}</div>
                    <div className="text-[10px] text-slate-500">KPIs</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Initiative dates */}
          {selectedElement.type === 'initiative' && 'startDate' in elementData && (() => {
            const initiative = elementData as Initiative;
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Start: {initiative.startDate}</span>
                  <span>End: {initiative.endDate}</span>
                </div>
                {(initiative.jiraIssueKey || initiative.jiraIssueUrl) && (
                  <a
                    href={initiative.jiraIssueUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Jira {initiative.jiraIssueType === 'task' ? 'Task' : 'Story'}: {initiative.jiraIssueKey || 'Open linked issue'}
                  </a>
                )}
              </div>
            );
          })()}

          {((selectedElement.type === 'lto' || selectedElement.type === 'ao') && 'jiraEpicKey' in elementData) && (() => {
            const objective = elementData as LongTermObjective | AnnualObjective;
            return (
              <>
                {(objective.jiraEpicKey || objective.jiraEpicUrl) && (
                  <a
                    href={objective.jiraEpicUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Jira Epic: {objective.jiraEpicKey || 'Open linked epic'}
                  </a>
                )}
              </>
            );
          })()}

          {/* View Details button for owners */}
          {selectedElement.type === 'owner' && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowOwnerDetails(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Details
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {showOwnerDetails && selectedElement.type === 'owner' && 'role' in elementData && (
        <OwnerDetailsModal
          key={`owner-details-${(elementData as Owner).id}`}
          owner={elementData as Owner}
          onClose={() => setShowOwnerDetails(false)}
        />
      )}
    </AnimatePresence>
  );
}
