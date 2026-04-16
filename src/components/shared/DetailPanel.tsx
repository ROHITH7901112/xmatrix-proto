'use client';

import { useXMatrixStore } from '@/lib/store';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn, getHealthClass, getStatusLabel } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Users, Target, Rocket, BarChart3 } from 'lucide-react';
import { Initiative, LongTermObjective, AnnualObjective } from '@/lib/types';

export function DetailPanel() {
  const { viewState, setSelectedElement, data } = useXMatrixStore();
  const { colors } = useTheme();
  const { selectedElement } = viewState;

  if (!selectedElement) return null;

  const getElementData = () => {
    switch (selectedElement.type) {
      case 'lto':
        return data.longTermObjectives.find((e) => e.id === selectedElement.id);
      case 'ao':
        return data.annualObjectives.find((e) => e.id === selectedElement.id);
      case 'initiative':
        return data.initiatives.find((e) => e.id === selectedElement.id);
      case 'kpi':
        return data.kpis.find((e) => e.id === selectedElement.id);
      case 'owner':
        return data.owners.find((e) => e.id === selectedElement.id);
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (selectedElement.type) {
      case 'lto': return 'Long-Term Objective';
      case 'ao': return 'Annual Objective';
      case 'initiative': return 'Initiative';
      case 'kpi': return 'KPI';
      case 'owner': return 'Owner';
      default: return '';
    }
  };

  const getTypeIcon = () => {
    switch (selectedElement.type) {
      case 'lto': return Target;
      case 'ao': return Target;
      case 'initiative': return Rocket;
      case 'kpi': return BarChart3;
      case 'owner': return Users;
      default: return Target;
    }
  };

  const elementData = getElementData();
  if (!elementData) return null;

  const Icon = getTypeIcon();
  const health = 'health' in elementData ? elementData.health : null;

  return (
    <AnimatePresence>
      <motion.div
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

          {/* Health Status */}
          {health && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status</span>
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', getHealthClass(health))}>
                {getStatusLabel(health)}
              </span>
            </div>
          )}

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
          {selectedElement.type === 'owner' && 'role' in elementData && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white font-semibold">
                  {elementData.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{elementData.name}</div>
                  <div className="text-xs text-slate-400">{elementData.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Responsibility</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 capitalize">
                  {elementData.responsibilityType}
                </span>
              </div>
            </div>
          )}

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

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
