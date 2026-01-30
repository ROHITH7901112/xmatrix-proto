// Utility functions
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Status label mapping: on-track → Completed, at-risk → In Progress, off-track → Delayed
export function getStatusLabel(health: 'on-track' | 'at-risk' | 'off-track'): string {
  const labels = {
    'on-track': 'Completed',
    'at-risk': 'In Progress',
    'off-track': 'Delayed',
  };
  return labels[health];
}

export function getHealthColor(health: 'on-track' | 'at-risk' | 'off-track', isDark: boolean = true): string {
  const colors = {
    'on-track': isDark ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)',
    'at-risk': isDark ? 'rgb(250, 204, 21)' : 'rgb(202, 138, 4)',
    'off-track': isDark ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',
  };
  return colors[health];
}

export function getHealthClass(health: 'on-track' | 'at-risk' | 'off-track'): string {
  const classes = {
    'on-track': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'at-risk': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    'off-track': 'text-red-400 bg-red-500/10 border-red-500/30',
  };
  return classes[health];
}

export function getRelationshipColor(strength: 'none' | 'primary' | 'secondary'): string {
  const colors = {
    'none': 'transparent',
    'primary': 'rgb(236, 72, 153)',    // Direct / Strong relationship
    'secondary': 'rgb(139, 92, 246)',  // Supporting relationship
  };
  return colors[strength];
}

export function getRelationshipDotSize(strength: 'none' | 'primary' | 'secondary'): number {
  const sizes = {
    'none': 0,
    'primary': 10,    // Larger dot for primary
    'secondary': 7,   // Smaller dot for secondary
  };
  return sizes[strength];
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  const icons = {
    'up': '↑',
    'down': '↓',
    'stable': '→',
  };
  return icons[trend];
}

export function getTrendColor(trend: 'up' | 'down' | 'stable', isPositive: boolean = true): string {
  if (trend === 'stable') return 'text-slate-400';
  if (trend === 'up') return isPositive ? 'text-emerald-400' : 'text-red-400';
  return isPositive ? 'text-red-400' : 'text-emerald-400';
}
