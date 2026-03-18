// filepath: src/lib/kpi-calculations.ts
// Pure, deterministic helper functions for KPI calculations.
// No side effects, no imports from store/components.

import { MonthlyKPIData, HealthStatus, Trend } from './types';

// ============ Variance ============

/**
 * Absolute variance: actual - target
 * Returns null if actual is null.
 */
export function computeVariance(actual: number | null, target: number): number | null {
  if (actual === null || actual === undefined) return null;
  return actual - target;
}

/**
 * Percentage variance: ((actual - target) / target) * 100
 * Safe against target=0 (returns null).
 */
export function computeVariancePercent(actual: number | null, target: number): number | null {
  if (actual === null || actual === undefined) return null;
  if (target === 0) return null;
  return ((actual - target) / target) * 100; // what does variancepercent 
}

// ============ Health Derivation ============

export interface HealthThresholds {
  /** Variance % at or above this → on-track. Default: 0 */
  onTrackMin: number;
  /** Variance % at or above this → at-risk. Below this → off-track. Default: -5 */
  atRiskMin: number;
}

const DEFAULT_THRESHOLDS: HealthThresholds = {
  onTrackMin: 0,
  atRiskMin: -5,
};

/**
 * Derive status from month-by-month execution quality.
 *
 * Rules implemented:
 * - ON-TRACK (green): monthly targets are being met consistently.
 * - AT-RISK (yellow): minor miss, short miss streak, or recent recovery after a miss.
 * - OFF-TRACK (red): latest month is severely off target.
 *
 * "Middle-month miss then recovery" behavior:
 * - If one month is missed and the following month recovers, status stays AT-RISK
 *   for one cycle (warning), then returns ON-TRACK if stability continues.
 */
export function deriveHealth(
  monthlyData: MonthlyKPIData[],
  thresholds: HealthThresholds = DEFAULT_THRESHOLDS,
  lowerIsBetter: boolean = false,
  overallTargetValue?: number
): HealthStatus {
  void overallTargetValue;

  // Evaluate only months with both target and actual values.
  const evaluated = monthlyData
    .filter(m => m.actual !== null && m.target > 0)
    .map(m => {
      const variancePct = computeVariancePercent(m.actual, m.target) ?? 0;
      const effectiveVariance = lowerIsBetter ? -variancePct : variancePct;
      return {
        miss: effectiveVariance < thresholds.onTrackMin,
        severeMiss: effectiveVariance < thresholds.atRiskMin,
      };
    });

  if (evaluated.length === 0) return 'on-track';

  // Current consecutive miss streak from latest month backwards.
  let currentMissStreak = 0;
  for (let i = evaluated.length - 1; i >= 0; i--) {
    if (!evaluated[i].miss) break;
    currentMissStreak += 1;
  }

  const latest = evaluated[evaluated.length - 1];
  const recentWindow = evaluated.slice(-3);
  const hasRecentSevereMiss = recentWindow.some(m => m.severeMiss);

  // One-month recovery watch: latest month met target, but previous month missed.
  const recoveredAfterRecentMiss =
    evaluated.length >= 2 && !evaluated[evaluated.length - 1].miss && evaluated[evaluated.length - 2].miss;

  // Red: latest month is severely off-track.
  if (latest.severeMiss) return 'off-track';

  // Yellow: any active miss streak, recent severe miss, or immediate recovery watch.
  if (currentMissStreak >= 1) return 'at-risk';
  if (hasRecentSevereMiss) return 'at-risk';
  if (recoveredAfterRecentMiss) return 'at-risk';

  return 'on-track';
}

// ============ Trend Derivation ============

/**
 * Derive trend from the last N months with actual values.
 * Uses simple slope: compare average of first half vs second half of recent actuals.
 * Deterministic — no randomness.
 * 
 * Trend Symbols:
 * - UP (↑): Positive trajectory — performance improving month-over-month
 *   For "higher is better" metrics: recent avg > earlier avg
 *   For "lower is better" metrics: recent avg < earlier avg (lower is progress)
 * - DOWN (↓): Negative trajectory — performance declining month-over-month
 *   Opposite of UP
 * - STABLE (—): Flat trajectory — change is below 1% of target (noise threshold)
 *
 * Example: If a KPI tracks 70, 72, 75, 78 over 4 months:
 * - First half avg: (70 + 72) / 2 = 71
 * - Second half avg: (75 + 78) / 2 = 76.5
 * - Diff: 76.5 - 71 = 5.5, which is > 1% threshold → Trend is UP
 *
 * For "days" or other "lower is better" metrics, the direction flips:
 * - Declining days (100, 95, 90) shows UP trend (improving performance)
 */
export function deriveTrend(
  monthlyData: MonthlyKPIData[],
  lowerIsBetter: boolean = false
): Trend {
  const withActuals = monthlyData.filter(m => m.actual !== null);

  if (withActuals.length < 2) return 'stable';

  // Use last 4 data points (or all if fewer)
  const recent = withActuals.slice(-4);

  if (recent.length < 2) return 'stable';

  const mid = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, mid);
  const secondHalf = recent.slice(mid);

  const avgFirst = firstHalf.reduce((sum, m) => sum + (m.actual as number), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, m) => sum + (m.actual as number), 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  // Use 1% of target as significance threshold to avoid noise
  const latestTarget = recent[recent.length - 1].target;
  const threshold = Math.abs(latestTarget) * 0.01;

  if (Math.abs(diff) < threshold) return 'stable';

  // For "lower is better" metrics, a decrease is actually "up" (good)
  if (lowerIsBetter) {
    return diff < 0 ? 'up' : 'down';
  }

  return diff > 0 ? 'up' : 'down';
}

// ============ Formatting ============

/**
 * Format a numeric value based on KPI unit for display.
 */
export function formatValue(value: number | null, unit: string): string {
  if (value === null || value === undefined) return '—';

  switch (unit) {
    case '$M':
      return value.toFixed(1);
    case '%':
      return value.toFixed(1);
    case 'days':
      return Math.round(value).toString();
    case 'pts':
      return Math.round(value).toString();
    default:
      return value.toFixed(1);
  }
}

/**
 * Format variance for display (with sign).
 */
export function formatVariance(variance: number | null, unit: string): string {
  if (variance === null) return '—';
  const sign = variance >= 0 ? '+' : '';
  return `${sign}${formatValue(variance, unit)}`;
}

/**
 * Determine if a KPI unit means "lower is better".
 */
export function isLowerBetter(unit: string, code?: string): boolean {
  // Cost ratios, time-based metrics — lower is better
  if (unit === 'days') return true;
  return false;
}

/**
 * Recompute all monthly variances for a KPI's monthly data.
 * Returns a new array (pure function).
 */
export function recomputeMonthlyData(monthlyData: MonthlyKPIData[]): MonthlyKPIData[] {
  return monthlyData.map(m => ({
    ...m,
    variance: computeVariance(m.actual, m.target),
  }));
}

/**
 * Get cumulative "actual" value from monthly data (sum of all non-null actuals).
 * This represents the total recorded progress across all months with data.
 */
export function getCurrentValue(monthlyData: MonthlyKPIData[]): number {
  const withActuals = monthlyData.filter(m => m.actual !== null);
  if (withActuals.length === 0) return 0;
  return withActuals.reduce((sum, m) => sum + (m.actual as number), 0);
}
