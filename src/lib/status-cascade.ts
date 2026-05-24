// Effective lifecycle status helpers.
//
// KPIs have no persisted `status` field — "done" is derived from
// currentValue vs targetValue. We cascade that derivation up the chain:
// an Initiative is effectively done when every linked KPI is done; an AO
// when every linked Initiative is effectively done; an LTO when every
// linked AO is effectively done.
//
// Key rule: if an entity HAS linked children, status is always computed
// from those children (ignoring any persisted done/active). Persisted
// status is only used as a fallback when there are NO children at all.

import {
  AnnualObjective,
  EntityStatus,
  Initiative,
  KPI,
  LongTermObjective,
  Relationship,
} from './types';
import { isLowerBetter } from './kpi-calculations';

export function isKpiDone(k: KPI): boolean {
  if (!(k.targetValue > 0)) return false;
  return isLowerBetter(k.unit, k.code)
    ? k.currentValue <= k.targetValue
    : k.currentValue >= k.targetValue;
}

// Collect IDs on the other end of an active (non-'none') relationship
// where one end is `entityId` of `entityType` and the other end is `otherType`.
function relatedIds(
  entityId: string,
  entityType: Relationship['sourceType'],
  otherType: Relationship['sourceType'],
  relationships: Relationship[],
): string[] {
  const ids: string[] = [];
  for (const r of relationships) {
    if (r.strength === 'none') continue;
    if (r.sourceId === entityId && r.sourceType === entityType && r.targetType === otherType) {
      ids.push(r.targetId);
    } else if (r.targetId === entityId && r.targetType === entityType && r.sourceType === otherType) {
      ids.push(r.sourceId);
    }
  }
  return ids;
}

export function getEffectiveInitiativeStatus(
  init: Initiative,
  kpis: KPI[],
  relationships: Relationship[],
): EntityStatus {
  const kpiIds = new Set(relatedIds(init.id, 'initiative', 'kpi', relationships));
  if (kpiIds.size === 0) return init.status ?? 'active';

  const linkedKpis = kpis.filter(k => kpiIds.has(k.id));
  if (linkedKpis.length === 0) return init.status ?? 'active';

  // Has children → compute; persisted done/active is ignored.
  return linkedKpis.every(isKpiDone) ? 'done' : 'active';
}

export function getEffectiveAoStatus(
  ao: AnnualObjective,
  initiatives: Initiative[],
  kpis: KPI[],
  relationships: Relationship[],
): EntityStatus {
  const initIds = new Set(relatedIds(ao.id, 'ao', 'initiative', relationships));
  if (initIds.size === 0) return ao.status ?? 'active';

  const linkedInits = initiatives.filter(i => initIds.has(i.id));
  if (linkedInits.length === 0) return ao.status ?? 'active';

  return linkedInits.every(i => getEffectiveInitiativeStatus(i, kpis, relationships) === 'done')
    ? 'done'
    : 'active';
}

export function computeAOProgress(
  aoId: string,
  initiatives: Initiative[],
  kpis: KPI[],
  relationships: Relationship[],
): { pct: number; done: number; total: number } {
  const initIds = new Set(relatedIds(aoId, 'ao', 'initiative', relationships));
  if (initIds.size === 0) return { pct: 0, done: 0, total: 0 };

  const linked = initiatives.filter(i => initIds.has(i.id));
  if (linked.length === 0) return { pct: 0, done: 0, total: 0 };

  const done = linked.filter(i =>
    getEffectiveInitiativeStatus(i, kpis, relationships) === 'done'
  ).length;

  return { pct: Math.round((done / linked.length) * 100), done, total: linked.length };
}

export function getEffectiveLtoStatus(
  lto: LongTermObjective,
  aos: AnnualObjective[],
  initiatives: Initiative[],
  kpis: KPI[],
  relationships: Relationship[],
): EntityStatus {
  const aoIds = new Set(relatedIds(lto.id, 'lto', 'ao', relationships));
  if (aoIds.size === 0) return lto.status ?? 'active';

  const linkedAos = aos.filter(a => aoIds.has(a.id));
  if (linkedAos.length === 0) return lto.status ?? 'active';

  return linkedAos.every(a => getEffectiveAoStatus(a, initiatives, kpis, relationships) === 'done')
    ? 'done'
    : 'active';
}
