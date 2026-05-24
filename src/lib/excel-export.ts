import * as xlsx from 'xlsx';
import { XMatrixData, HealthStatus, Relationship } from './types';
import { isKpiDone, computeAOProgress } from './status-cascade';
import { isLowerBetter } from './kpi-calculations';

export interface ExportOptions {
  overview: boolean;
  alignment: boolean;
  objectives: boolean;
  initiatives: boolean;
  kpis: boolean;
  monthlyData: boolean;
  owners: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  overview: true,
  alignment: true,
  objectives: true,
  initiatives: true,
  kpis: true,
  monthlyData: true,
  owners: true,
};

// --- Style helpers ---

type CellStyle = Record<string, unknown>;

const BORDER_COLOR = 'CBD5E1';
const THIN_BORDER = { style: 'thin' as const, color: { rgb: BORDER_COLOR } };
const ALL_BORDERS = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };

function headerStyle(): CellStyle {
  return {
    fill: { patternType: 'solid', fgColor: { rgb: '0F172A' } },
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    border: ALL_BORDERS,
  };
}

function sectionHeaderStyle(): CellStyle {
  return {
    fill: { patternType: 'solid', fgColor: { rgb: '1E293B' } },
    font: { bold: true, color: { rgb: '94A3B8' }, sz: 9, name: 'Calibri' },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: ALL_BORDERS,
  };
}

function healthFill(health: HealthStatus): CellStyle {
  const map: Record<HealthStatus, { bg: string; fg: string }> = {
    'on-track':  { bg: 'DCFCE7', fg: '166534' },
    'at-risk':   { bg: 'FEF3C7', fg: '92400E' },
    'off-track': { bg: 'FEE2E2', fg: '991B1B' },
  };
  const { bg, fg } = map[health] ?? map['on-track'];
  return {
    fill: { patternType: 'solid', fgColor: { rgb: bg } },
    font: { bold: true, color: { rgb: fg }, sz: 10, name: 'Calibri' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ALL_BORDERS,
  };
}

function varianceFill(val: number | null): CellStyle | null {
  if (val === null) return null;
  const base: CellStyle = { border: ALL_BORDERS, alignment: { horizontal: 'right', vertical: 'center' }, font: { sz: 10, name: 'Calibri' } };
  if (val > 0)  return { ...base, fill: { patternType: 'solid', fgColor: { rgb: 'DCFCE7' } }, font: { ...base.font as object, bold: true, color: { rgb: '166534' } } };
  if (val < 0)  return { ...base, fill: { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } }, font: { ...base.font as object, bold: true, color: { rgb: '991B1B' } } };
  return { ...base, fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } } };
}

function dataCell(rowIdx: number, align: 'left' | 'center' | 'right' = 'left'): CellStyle {
  const isAlt = rowIdx % 2 === 1;
  const style: CellStyle = {
    font: { sz: 10, name: 'Calibri' },
    alignment: { horizontal: align, vertical: 'center', wrapText: false },
    border: ALL_BORDERS,
  };
  if (isAlt) style.fill = { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } };
  return style;
}

function styleCell(ws: xlsx.WorkSheet, row: number, col: number, style: CellStyle) {
  const addr = xlsx.utils.encode_cell({ r: row, c: col });
  if (!ws[addr]) ws[addr] = { t: 'z', v: '' };
  ws[addr].s = style;
}

function styleRow(ws: xlsx.WorkSheet, row: number, colCount: number, style: CellStyle) {
  for (let c = 0; c < colCount; c++) styleCell(ws, row, c, style);
}

function setColWidths(ws: xlsx.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map(wch => ({ wch }));
}

function setRowHeights(ws: xlsx.WorkSheet, heights: { row: number; hpt: number }[]) {
  const rows: xlsx.RowInfo[] = [];
  for (const { row, hpt } of heights) {
    rows[row] = { hpt };
  }
  ws['!rows'] = rows;
}

function applyDataRowStyles(
  ws: xlsx.WorkSheet,
  rows: unknown[][],
  startRow: number,
  colAligns: ('left' | 'center' | 'right')[],
  skipCols: Set<number> = new Set(),
) {
  for (let r = startRow; r < rows.length; r++) {
    const rowIdx = r - startRow;
    for (let c = 0; c < colAligns.length; c++) {
      if (skipCols.has(c)) continue;
      styleCell(ws, r, c, dataCell(rowIdx, colAligns[c]));
    }
  }
}

// --- Relationship traversal ---

function relatedIds(
  rels: Relationship[],
  entityId: string,
  entityType: string,
  otherType: string,
): string[] {
  return rels
    .filter(r => r.strength !== 'none')
    .filter(r =>
      (r.sourceType === entityType && r.sourceId === entityId && r.targetType === otherType) ||
      (r.targetType === entityType && r.targetId === entityId && r.sourceType === otherType),
    )
    .map(r => (r.sourceType === entityType && r.sourceId === entityId ? r.targetId : r.sourceId));
}

// --- Sheet builders ---

function buildOverviewSheet(data: XMatrixData): xlsx.WorkSheet {
  const doneKPIs = data.kpis.filter(isKpiDone).length;
  const totalKPIs = data.kpis.length;
  const ach = totalKPIs > 0 ? Math.round((doneKPIs / totalKPIs) * 100) : 0;

  function healthCounts(items: { health: HealthStatus }[]) {
    return items.reduce(
      (acc, i) => { acc[i.health]++; return acc; },
      { 'on-track': 0, 'at-risk': 0, 'off-track': 0 } as Record<HealthStatus, number>,
    );
  }

  const ltoH = healthCounts(data.longTermObjectives);
  const aoH  = healthCounts(data.annualObjectives);
  const iniH = healthCounts(data.initiatives);
  const kpiH = healthCounts(data.kpis);

  const aoa: (string | number)[][] = [
    // Section 1: Matrix Info
    ['Matrix Information', ''],
    ['Matrix Name',   data.name ?? ''],
    ['Vision',        data.vision ?? ''],
    ['True North',    data.trueNorth ?? ''],
    ['Period',        `${data.periodStart ?? ''} – ${data.periodEnd ?? ''}`],
    ['', ''],
    // Section 2: Entity counts
    ['Entity Summary', 'Count'],
    ['Long-Term Objectives', data.longTermObjectives.length],
    ['Annual Objectives',    data.annualObjectives.length],
    ['Initiatives',          data.initiatives.length],
    ['KPIs',                 data.kpis.length],
    ['Owners',               data.owners.length],
    ['', ''],
    // Section 3: Health breakdown
    ['Health Distribution', 'On Track', 'At Risk', 'Off Track'],
    ['Long-Term Objectives', ltoH['on-track'], ltoH['at-risk'], ltoH['off-track']],
    ['Annual Objectives',    aoH['on-track'],  aoH['at-risk'],  aoH['off-track']],
    ['Initiatives',          iniH['on-track'], iniH['at-risk'], iniH['off-track']],
    ['KPIs',                 kpiH['on-track'], kpiH['at-risk'], kpiH['off-track']],
    ['', ''],
    // Section 4: Achievement
    ['KPI Achievement', ''],
    ['Overall Achievement', `${ach}%`],
    ['KPIs On Target',      `${doneKPIs} of ${totalKPIs}`],
  ];

  const ws = xlsx.utils.aoa_to_sheet(aoa);

  // Section header rows
  styleRow(ws, 0, 2, sectionHeaderStyle());
  styleRow(ws, 6, 2, sectionHeaderStyle());
  styleRow(ws, 13, 4, sectionHeaderStyle());
  styleRow(ws, 19, 2, sectionHeaderStyle());

  // Data rows - section 1
  for (let r = 1; r <= 4; r++) styleRow(ws, r, 2, dataCell(r - 1));
  // Data rows - section 2
  for (let r = 7; r <= 11; r++) {
    styleCell(ws, r, 0, dataCell(r - 7));
    styleCell(ws, r, 1, dataCell(r - 7, 'center'));
  }
  // Health table data rows
  for (let r = 14; r <= 17; r++) {
    styleCell(ws, r, 0, dataCell(r - 14));
    styleCell(ws, r, 1, healthFill('on-track'));
    styleCell(ws, r, 2, healthFill('at-risk'));
    styleCell(ws, r, 3, healthFill('off-track'));
  }
  // Achievement rows
  for (let r = 20; r <= 21; r++) {
    styleCell(ws, r, 0, dataCell(r - 20));
    styleCell(ws, r, 1, { ...dataCell(r - 20, 'center'), font: { bold: true, sz: 11, name: 'Calibri', color: { rgb: '1D4ED8' } } });
  }

  setColWidths(ws, [32, 40, 14, 14]);
  setRowHeights(ws, [{ row: 0, hpt: 18 }, { row: 6, hpt: 18 }, { row: 13, hpt: 18 }, { row: 19, hpt: 18 }]);
  return ws;
}

function buildAlignmentSheet(data: XMatrixData): xlsx.WorkSheet {
  const headers = [
    'LTO Code', 'LTO Title',
    'AO Code', 'AO Title',
    'Initiative Code', 'Initiative Title',
    'KPI Code', 'KPI Title', 'Unit',
    'Current', 'Target', 'Achievement %', 'Health', 'Owner(s)',
  ];
  const colAligns: ('left' | 'center' | 'right')[] = [
    'center', 'left', 'center', 'left', 'center', 'left',
    'center', 'left', 'center', 'right', 'right', 'center', 'center', 'left',
  ];
  const healthCol = 12;

  const rows: (string | number | null)[][] = [headers];
  const healthValues: HealthStatus[] = [];

  for (const kpi of data.kpis) {
    const lowerBetter = isLowerBetter(kpi.unit, kpi.code);
    const ach = kpi.targetValue > 0
      ? Math.round(lowerBetter
          ? (kpi.targetValue / Math.max(kpi.currentValue, 0.001)) * 100
          : (kpi.currentValue / kpi.targetValue) * 100)
      : 0;
    const ownerNames = kpi.ownerIds
      .map(id => data.owners.find(o => o.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const kpiBase = [kpi.code, kpi.title, kpi.unit, kpi.currentValue, kpi.targetValue, `${ach}%`, kpi.health, ownerNames];
    const initIds = relatedIds(data.relationships, kpi.id, 'kpi', 'initiative');

    if (initIds.length === 0) {
      rows.push(['', '', '', '', '', '', ...kpiBase]);
      healthValues.push(kpi.health);
      continue;
    }

    for (const initId of initIds) {
      const init = data.initiatives.find(i => i.id === initId);
      const aoIds = relatedIds(data.relationships, initId, 'initiative', 'ao');

      if (aoIds.length === 0) {
        rows.push(['', '', '', '', init?.code ?? '', init?.title ?? '', ...kpiBase]);
        healthValues.push(kpi.health);
        continue;
      }

      for (const aoId of aoIds) {
        const ao = data.annualObjectives.find(a => a.id === aoId);
        const ltoIds = relatedIds(data.relationships, aoId, 'ao', 'lto');

        if (ltoIds.length === 0) {
          rows.push(['', '', ao?.code ?? '', ao?.title ?? '', init?.code ?? '', init?.title ?? '', ...kpiBase]);
          healthValues.push(kpi.health);
          continue;
        }

        for (const ltoId of ltoIds) {
          const lto = data.longTermObjectives.find(l => l.id === ltoId);
          rows.push([lto?.code ?? '', lto?.title ?? '', ao?.code ?? '', ao?.title ?? '', init?.code ?? '', init?.title ?? '', ...kpiBase]);
          healthValues.push(kpi.health);
        }
      }
    }
  }

  const ws = xlsx.utils.aoa_to_sheet(rows);
  styleRow(ws, 0, headers.length, headerStyle());
  setRowHeights(ws, [{ row: 0, hpt: 22 }]);

  applyDataRowStyles(ws, rows, 1, colAligns, new Set([healthCol]));
  for (let i = 0; i < healthValues.length; i++) {
    styleCell(ws, i + 1, healthCol, healthFill(healthValues[i]));
  }

  setColWidths(ws, [10, 30, 10, 30, 12, 30, 10, 30, 8, 10, 10, 14, 12, 22]);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as unknown as xlsx.ColInfo;
  return ws;
}

function buildLTOSheet(data: XMatrixData): xlsx.WorkSheet {
  const headers = ['Code', 'Title', 'Description', 'Timeframe', 'Health', 'Status'];
  const colAligns: ('left' | 'center' | 'right')[] = ['center', 'left', 'left', 'center', 'center', 'center'];
  const rows: (string | number | null)[][] = [headers];
  const healthValues: HealthStatus[] = [];

  for (const lto of data.longTermObjectives) {
    rows.push([lto.code, lto.title, lto.description ?? '', lto.timeframe ?? '', lto.health, lto.status ?? 'active']);
    healthValues.push(lto.health);
  }

  const ws = xlsx.utils.aoa_to_sheet(rows);
  styleRow(ws, 0, headers.length, headerStyle());
  setRowHeights(ws, [{ row: 0, hpt: 22 }]);
  applyDataRowStyles(ws, rows, 1, colAligns, new Set([4]));
  for (let i = 0; i < healthValues.length; i++) styleCell(ws, i + 1, 4, healthFill(healthValues[i]));
  setColWidths(ws, [10, 38, 48, 15, 14, 12]);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as unknown as xlsx.ColInfo;
  return ws;
}

function buildAOSheet(data: XMatrixData): xlsx.WorkSheet {
  const headers = ['Code', 'Title', 'Description', 'Year', 'Initiative Progress', 'Health', 'Status'];
  const colAligns: ('left' | 'center' | 'right')[] = ['center', 'left', 'left', 'center', 'center', 'center', 'center'];
  const rows: (string | number | null)[][] = [headers];
  const healthValues: HealthStatus[] = [];

  for (const ao of data.annualObjectives) {
    const { pct, done, total } = computeAOProgress(ao.id, data.initiatives, data.kpis, data.relationships);
    const progressLabel = total > 0 ? `${done}/${total} done (${pct}%)` : 'No initiatives linked';
    rows.push([ao.code, ao.title, ao.description ?? '', ao.year ?? '', progressLabel, ao.health, ao.status ?? 'active']);
    healthValues.push(ao.health);
  }

  const ws = xlsx.utils.aoa_to_sheet(rows);
  styleRow(ws, 0, headers.length, headerStyle());
  setRowHeights(ws, [{ row: 0, hpt: 22 }]);
  applyDataRowStyles(ws, rows, 1, colAligns, new Set([5]));
  for (let i = 0; i < healthValues.length; i++) styleCell(ws, i + 1, 5, healthFill(healthValues[i]));
  setColWidths(ws, [10, 38, 48, 8, 22, 14, 12]);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as unknown as xlsx.ColInfo;
  return ws;
}

function buildInitiativesSheet(data: XMatrixData): xlsx.WorkSheet {
  const headers = ['Code', 'Title', 'Description', 'Priority', 'Start Date', 'End Date', 'Health', 'Status', 'Jira Key'];
  const colAligns: ('left' | 'center' | 'right')[] = ['center', 'left', 'left', 'center', 'center', 'center', 'center', 'center', 'center'];
  const rows: (string | number | null)[][] = [headers];
  const healthValues: HealthStatus[] = [];

  for (const init of data.initiatives) {
    rows.push([
      init.code, init.title, init.description ?? '',
      init.priority ?? '', init.startDate ?? '', init.endDate ?? '',
      init.health, init.status ?? 'active', init.jiraIssueKey ?? '',
    ]);
    healthValues.push(init.health);
  }

  const ws = xlsx.utils.aoa_to_sheet(rows);
  styleRow(ws, 0, headers.length, headerStyle());
  setRowHeights(ws, [{ row: 0, hpt: 22 }]);
  applyDataRowStyles(ws, rows, 1, colAligns, new Set([6]));
  for (let i = 0; i < healthValues.length; i++) styleCell(ws, i + 1, 6, healthFill(healthValues[i]));
  setColWidths(ws, [10, 38, 48, 12, 12, 12, 14, 12, 15]);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as unknown as xlsx.ColInfo;
  return ws;
}

function buildKPISheet(data: XMatrixData): xlsx.WorkSheet {
  const headers = ['Code', 'Title', 'Unit', 'Current', 'Target', 'Achievement %', 'Health', 'Trend', 'Owner(s)'];
  const colAligns: ('left' | 'center' | 'right')[] = ['center', 'left', 'center', 'right', 'right', 'center', 'center', 'center', 'left'];
  const rows: (string | number | null)[][] = [headers];
  const healthValues: HealthStatus[] = [];
  const achValues: number[] = [];

  for (const kpi of data.kpis) {
    const lowerBetter = isLowerBetter(kpi.unit, kpi.code);
    const ach = kpi.targetValue > 0
      ? Math.round(lowerBetter
          ? (kpi.targetValue / Math.max(kpi.currentValue, 0.001)) * 100
          : (kpi.currentValue / kpi.targetValue) * 100)
      : 0;
    const ownerNames = kpi.ownerIds
      .map(id => data.owners.find(o => o.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    rows.push([kpi.code, kpi.title, kpi.unit, kpi.currentValue, kpi.targetValue, `${ach}%`, kpi.health, kpi.trend, ownerNames]);
    healthValues.push(kpi.health);
    achValues.push(ach);
  }

  const ws = xlsx.utils.aoa_to_sheet(rows);
  styleRow(ws, 0, headers.length, headerStyle());
  setRowHeights(ws, [{ row: 0, hpt: 22 }]);
  applyDataRowStyles(ws, rows, 1, colAligns, new Set([5, 6]));

  for (let i = 0; i < healthValues.length; i++) {
    styleCell(ws, i + 1, 6, healthFill(healthValues[i]));
    // Color achievement % cell
    const ach = achValues[i];
    const achStyle: CellStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: ach >= 100 ? 'DCFCE7' : ach >= 70 ? 'FEF3C7' : 'FEE2E2' } },
      font: { bold: true, sz: 10, name: 'Calibri', color: { rgb: ach >= 100 ? '166534' : ach >= 70 ? '92400E' : '991B1B' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: ALL_BORDERS,
    };
    styleCell(ws, i + 1, 5, achStyle);
  }

  setColWidths(ws, [10, 38, 8, 10, 10, 14, 14, 10, 28]);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as unknown as xlsx.ColInfo;
  return ws;
}

function buildMonthlySheet(data: XMatrixData): xlsx.WorkSheet {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthHeaders = MONTHS.flatMap(m => [`${m} Target`, `${m} Actual`, `${m} Var`]);
  const headers = ['KPI Code', 'KPI Title', 'Year', ...monthHeaders];
  const rows: (string | number | null)[][] = [headers];

  for (const kpi of data.kpis) {
    const byYear = new Map<number, typeof kpi.monthlyData>();
    for (const m of kpi.monthlyData) {
      if (!m.year) continue;
      if (!byYear.has(m.year)) byYear.set(m.year, []);
      byYear.get(m.year)!.push(m);
    }

    for (const [year, months] of byYear) {
      const row: (string | number | null)[] = [kpi.code, kpi.title, year];
      for (const monthName of MONTHS) {
        const m = months.find(x => x.month === monthName);
        row.push(m?.target ?? null, m?.actual ?? null, m?.variance ?? null);
      }
      rows.push(row);
    }
  }

  const ws = xlsx.utils.aoa_to_sheet(rows);
  styleRow(ws, 0, headers.length, headerStyle());
  setRowHeights(ws, [{ row: 0, hpt: 22 }]);

  // Apply base data styles for first 3 cols
  for (let r = 1; r < rows.length; r++) {
    const rowIdx = r - 1;
    styleCell(ws, r, 0, dataCell(rowIdx, 'center'));
    styleCell(ws, r, 1, dataCell(rowIdx, 'left'));
    styleCell(ws, r, 2, dataCell(rowIdx, 'center'));
  }

  // Color variance cells and apply alignment to all monthly cols
  for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    const altIdx = rowIdx - 1;
    for (let mIdx = 0; mIdx < 12; mIdx++) {
      const tCol = 3 + mIdx * 3;
      const aCol = tCol + 1;
      const vCol = tCol + 2;

      styleCell(ws, rowIdx, tCol, dataCell(altIdx, 'right'));
      styleCell(ws, rowIdx, aCol, dataCell(altIdx, 'right'));

      const varVal = rows[rowIdx][vCol] as number | null;
      const varStyle = varianceFill(varVal);
      styleCell(ws, rowIdx, vCol, varStyle ?? dataCell(altIdx, 'right'));
    }
  }

  const baseWidths = [10, 32, 8];
  const monthWidths = Array(36).fill(9);
  setColWidths(ws, [...baseWidths, ...monthWidths]);
  ws['!freeze'] = { xSplit: 3, ySplit: 1 } as unknown as xlsx.ColInfo;
  return ws;
}

function buildOwnersSheet(data: XMatrixData): xlsx.WorkSheet {
  const headers = ['Name', 'Role', 'Initials', 'Responsibility Type'];
  const colAligns: ('left' | 'center' | 'right')[] = ['left', 'left', 'center', 'center'];
  const rows: (string | number | null)[][] = [headers];

  for (const owner of data.owners) {
    rows.push([owner.name, owner.role ?? '', owner.initials ?? '', owner.responsibilityType ?? '']);
  }

  const ws = xlsx.utils.aoa_to_sheet(rows);
  styleRow(ws, 0, headers.length, headerStyle());
  setRowHeights(ws, [{ row: 0, hpt: 22 }]);
  applyDataRowStyles(ws, rows, 1, colAligns);
  setColWidths(ws, [30, 30, 12, 20]);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as unknown as xlsx.ColInfo;
  return ws;
}

// --- Main export function ---

export function exportToExcel(data: XMatrixData, options: ExportOptions): Blob {
  const wb = xlsx.utils.book_new();

  if (options.overview) {
    xlsx.utils.book_append_sheet(wb, buildOverviewSheet(data), 'Strategy Overview');
  }
  if (options.alignment) {
    xlsx.utils.book_append_sheet(wb, buildAlignmentSheet(data), 'Strategy Alignment');
  }
  if (options.objectives) {
    if (data.longTermObjectives.length > 0)
      xlsx.utils.book_append_sheet(wb, buildLTOSheet(data), 'Long-Term Objectives');
    if (data.annualObjectives.length > 0)
      xlsx.utils.book_append_sheet(wb, buildAOSheet(data), 'Annual Objectives');
  }
  if (options.initiatives && data.initiatives.length > 0) {
    xlsx.utils.book_append_sheet(wb, buildInitiativesSheet(data), 'Initiatives');
  }
  if (options.kpis && data.kpis.length > 0) {
    xlsx.utils.book_append_sheet(wb, buildKPISheet(data), 'KPIs');
  }
  if (options.monthlyData) {
    xlsx.utils.book_append_sheet(wb, buildMonthlySheet(data), 'Monthly KPI Data');
  }
  if (options.owners && data.owners.length > 0) {
    xlsx.utils.book_append_sheet(wb, buildOwnersSheet(data), 'Owners');
  }

  const buf = xlsx.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function exportToJSON(data: XMatrixData): Blob {
  const exportData = {
    exportedAt: new Date().toISOString(),
    matrix: {
      name: data.name,
      vision: data.vision,
      trueNorth: data.trueNorth,
      period: { start: data.periodStart, end: data.periodEnd },
    },
    longTermObjectives: data.longTermObjectives,
    annualObjectives: data.annualObjectives,
    initiatives: data.initiatives,
    kpis: data.kpis,
    owners: data.owners,
    relationships: data.relationships,
  };
  return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
}
