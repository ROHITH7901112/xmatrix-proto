// Database connection and initialization using better-sqlite3

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { 
  XMatrixData, 
  Owner, 
  LongTermObjective, 
  AnnualObjective, 
  Initiative, 
  KPI, 
  Relationship,
  MonthlyKPIData,
  HealthStatus,
  Trend,
  RelationshipStrength,
  TargetDistribution,
} from './types';
import { getCurrentValue, deriveHealth, deriveTrend, isLowerBetter } from './kpi-calculations';

// Database file path - stored in project root
const DB_PATH = path.join(process.cwd(), 'xmatrix.db');

// Singleton database instance
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');  // reads the SQL schema and then converts to string
  db!.exec(schema);  //db! means we are sure db is not null here
  runMigrations();
}

/** Add new columns to existing databases without breaking existing data */
function runMigrations(): void {
  const addColumn = (table: string, column: string, definition: string) => {
    try {
      db!.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch {
      // Column already exists — ignore
    }
  };
  addColumn('kpis', 'start_date', 'TEXT');
  addColumn('kpis', 'end_date', 'TEXT');
  addColumn('kpis', 'target_distribution', "TEXT DEFAULT 'equal'");
  
  // Check if year column exists in monthly_kpi_data table
  try {
    const columnInfo = db!.prepare("PRAGMA table_info(monthly_kpi_data)").all() as { name: string }[];
    const hasYearColumn = columnInfo.some(col => col.name === 'year');
    
    if (!hasYearColumn) {
      // Add year column if it doesn't exist
      db!.exec('ALTER TABLE monthly_kpi_data ADD COLUMN year INTEGER');
      
      // Set default year for existing data
      db!.exec("UPDATE monthly_kpi_data SET year = CAST(strftime('%Y','now') AS INTEGER) WHERE year IS NULL");
    }
  } catch (error) {
    console.error('Error checking/adding year column:', error);
    // Try to add column directly as fallback
    addColumn('monthly_kpi_data', 'year', 'INTEGER');
  }

  try {
    db!.exec('CREATE INDEX IF NOT EXISTS idx_monthly_kpi_year ON monthly_kpi_data(kpi_id, year)');
  } catch {
    // ignore
  }

  try {
    db!.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_monthly_kpi_year_month ON monthly_kpi_data(kpi_id, year, month)');
  } catch {
    // If duplicates exist from pre-migration data, dedupe and retry once.
    try {
      db!.exec(`
        DELETE FROM monthly_kpi_data
        WHERE id NOT IN (
          SELECT MAX(id)
          FROM monthly_kpi_data
          GROUP BY kpi_id, year, month
        )
      `);
      db!.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_monthly_kpi_year_month ON monthly_kpi_data(kpi_id, year, month)');
    } catch {
      // final fallback: leave index creation skipped
    }
  }
}

// ============ XMatrix CRUD ============

export function getAllXMatrices(): XMatrixData[] {  //this function
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM xmatrix').all() as {
    id: string;
    name: string;
    vision: string;
    true_north: string;
    period_start: number;
    period_end: number;
    themes: string;
  }[];
  
  return rows.map(row => getXMatrixById(row.id)!);
}

export function getXMatrixById(id: string): XMatrixData | null { // if not found,return null
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM xmatrix WHERE id = ?').get(id) as {
    id: string;
    name: string;
    vision: string;
    true_north: string;
    period_start: number;
    period_end: number;
    themes: string;
  } | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    vision: row.vision,
    trueNorth: row.true_north,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    themes: JSON.parse(row.themes || '[]'),
    longTermObjectives: getLongTermObjectivesByXMatrix(id),
    annualObjectives: getAnnualObjectivesByXMatrix(id),
    initiatives: getInitiativesByXMatrix(id),
    kpis: getKPIsByXMatrix(id),
    owners: getOwnersByXMatrix(id),
    relationships: getRelationshipsByXMatrix(id),
  };
}

export function createXMatrix(data: Omit<XMatrixData, 'longTermObjectives' | 'annualObjectives' | 'initiatives' | 'kpis' | 'owners' | 'relationships'>): XMatrixData {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO xmatrix (id, name, vision, true_north, period_start, period_end, themes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    data.id,
    data.name,
    data.vision,
    data.trueNorth,
    data.periodStart,
    data.periodEnd,
    JSON.stringify(data.themes)
  );
  
  return getXMatrixById(data.id)!;
}

export function updateXMatrix(id: string, data: Partial<XMatrixData>): XMatrixData | null {
  const db = getDatabase();
  const current = getXMatrixById(id);
  if (!current) return null;
  
  const stmt = db.prepare(`
    UPDATE xmatrix SET name = ?, vision = ?, true_north = ?, period_start = ?, period_end = ?, themes = ?
    WHERE id = ?
  `);
  
  stmt.run(   // If data already has that field , use it else use the existing value in the db.
    data.name ?? current.name,  //?? is nullish coalescing operator 
    data.vision ?? current.vision,
    data.trueNorth ?? current.trueNorth,
    data.periodStart ?? current.periodStart,
    data.periodEnd ?? current.periodEnd,
    JSON.stringify(data.themes ?? current.themes),
    id
  );
  
  return getXMatrixById(id); // after update, fetch the latest data and return it. This ensures we return the complete XMatrixData with all related entities. If the update fails (e.g., due to a non-existent ID), we return null.
}

export function deleteXMatrix(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM xmatrix WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ Owner CRUD ============

export function getOwnersByXMatrix(xmatrixId: string): Owner[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM owners WHERE xmatrix_id = ?').all(xmatrixId) as {
    id: string;
    xmatrix_id: string;
    name: string;
    role: string;
    avatar: string;
    initials: string;
    responsibility_type: string;
  }[]; // we are telling typescript that the result of the query will be an array of objects with these specific fields. This allows us to have type safety when accessing the properties of each row in the subsequent map function.
  
  return rows.map(row => ({ 
    id: row.id,
    name: row.name,
    role: row.role,
    avatar: row.avatar,
    initials: row.initials,
    responsibilityType: row.responsibility_type as Owner['responsibilityType'], 
  }));
}

export function getOwnerById(id: string): Owner | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM owners WHERE id = ?').get(id) as {
    id: string;
    name: string;
    role: string;
    avatar: string;
    initials: string;
    responsibility_type: string;
  } | undefined; 
  
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    avatar: row.avatar,
    initials: row.initials,
    responsibilityType: row.responsibility_type as Owner['responsibilityType'],
  };
}

export function createOwner(xmatrixId: string, data: Owner): Owner {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO owners (id, xmatrix_id, name, role, avatar, initials, responsibility_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(data.id, xmatrixId, data.name, data.role, data.avatar, data.initials, data.responsibilityType); 
  return getOwnerById(data.id)!;
}

export function updateOwner(id: string, data: Partial<Owner>): Owner | null {
  const db = getDatabase();
  const current = getOwnerById(id);
  if (!current) return null;
  
  const stmt = db.prepare(`
    UPDATE owners SET name = ?, role = ?, avatar = ?, initials = ?, responsibility_type = ?
    WHERE id = ?
  `);
  
  stmt.run(
    data.name ?? current.name, 
    data.role ?? current.role,
    data.avatar ?? current.avatar,
    data.initials ?? current.initials,
    data.responsibilityType ?? current.responsibilityType,
    id
  );
  
  return getOwnerById(id);
}

export function deleteOwner(id: string): boolean {
  const db = getDatabase();
  // Delete all relationships referencing this owner (both source and target)
  db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?').run(id, id);
  const result = db.prepare('DELETE FROM owners WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ Long-Term Objective CRUD ============

export function getLongTermObjectivesByXMatrix(xmatrixId: string): LongTermObjective[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM long_term_objectives WHERE xmatrix_id = ?').all(xmatrixId) as {
    id: string;
    code: string;
    title: string;
    description: string;
    timeframe: string;
    health: string;
  }[];
  
  return rows.map(row => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    timeframe: row.timeframe,
    health: row.health as HealthStatus,
  }));
}

export function getLongTermObjectiveById(id: string): LongTermObjective | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM long_term_objectives WHERE id = ?').get(id) as {
    id: string;
    code: string;
    title: string;
    description: string;
    timeframe: string;
    health: string;
  } | undefined;  
  
  if (!row) return null;
  
  return { //
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    timeframe: row.timeframe,
    health: row.health as HealthStatus,
  };
}

export function createLongTermObjective(xmatrixId: string, data: LongTermObjective): LongTermObjective {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO long_term_objectives (id, xmatrix_id, code, title, description, timeframe, health)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(data.id, xmatrixId, data.code, data.title, data.description, data.timeframe, data.health);
  return getLongTermObjectiveById(data.id)!; //the purpose of the ! at the end of this line? It is a non-null assertion operator in TypeScript. It tells the TypeScript compiler that we are certain that the value returned by getLongTermObjectiveById(data.id) will not be null or undefined. In this context, since we just inserted a new long-term objective with data.id, we expect that fetching it immediately afterward will succeed and return a valid LongTermObjective object. By using the ! operator, we avoid having to handle the case where it might return null, which simplifies our code. However, it's important to use this operator with caution, as it can lead to runtime errors if our assumption is incorrect.
}

export function updateLongTermObjective(id: string, data: Partial<LongTermObjective>): LongTermObjective | null {
  const db = getDatabase();
  const current = getLongTermObjectiveById(id);
  if (!current) return null;
  
  const stmt = db.prepare(`
    UPDATE long_term_objectives SET code = ?, title = ?, description = ?, timeframe = ?, health = ?
    WHERE id = ?
  `); 
  
  stmt.run(
    data.code ?? current.code,
    data.title ?? current.title,
    data.description ?? current.description,
    data.timeframe ?? current.timeframe,
    data.health ?? current.health,
    id
  );
  
  return getLongTermObjectiveById(id);
}

export function deleteLongTermObjective(id: string): boolean {
  const db = getDatabase();
  // Delete all relationships referencing this objective (both source and target)
  db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?').run(id, id);
  const result = db.prepare('DELETE FROM long_term_objectives WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ Annual Objective CRUD ============

export function getAnnualObjectivesByXMatrix(xmatrixId: string): AnnualObjective[] { 
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM annual_objectives WHERE xmatrix_id = ?').all(xmatrixId) as {
    id: string;
    code: string;
    title: string;
    description: string;
    year: number;
    health: string;
    progress: number;
  }[];
  
  return rows.map(row => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    year: row.year,
    health: row.health as HealthStatus,
    progress: row.progress,
  }));
}

export function getAnnualObjectiveById(id: string): AnnualObjective | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM annual_objectives WHERE id = ?').get(id) as {
    id: string;
    code: string;
    title: string;
    description: string;
    year: number;
    health: string;
    progress: number;
  } | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    year: row.year,
    health: row.health as HealthStatus,
    progress: row.progress,
  };
}

export function createAnnualObjective(xmatrixId: string, data: AnnualObjective): AnnualObjective {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO annual_objectives (id, xmatrix_id, code, title, description, year, health, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(data.id, xmatrixId, data.code, data.title, data.description, data.year, data.health, data.progress); 
  return getAnnualObjectiveById(data.id)!;
}

export function updateAnnualObjective(id: string, data: Partial<AnnualObjective>): AnnualObjective | null {
  const db = getDatabase();
  const current = getAnnualObjectiveById(id);
  if (!current) return null;
  
  const stmt = db.prepare(`
    UPDATE annual_objectives SET code = ?, title = ?, description = ?, year = ?, health = ?, progress = ?
    WHERE id = ?
  `);
  
  stmt.run(
    data.code ?? current.code,
    data.title ?? current.title,
    data.description ?? current.description,
    data.year ?? current.year,
    data.health ?? current.health,
    data.progress ?? current.progress,
    id
  );
  
  return getAnnualObjectiveById(id);
}

export function deleteAnnualObjective(id: string): boolean {
  const db = getDatabase();
  // Delete all relationships referencing this objective (both source and target)
  db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?').run(id, id);
  const result = db.prepare('DELETE FROM annual_objectives WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ Initiative CRUD ============

export function getInitiativesByXMatrix(xmatrixId: string): Initiative[] { 
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM initiatives WHERE xmatrix_id = ?').all(xmatrixId) as {
    id: string;
    code: string;
    title: string;
    description: string;
    priority: string;
    health: string;
    start_date: string;
    end_date: string;
  }[];
  
  return rows.map(row => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    priority: row.priority as Initiative['priority'], 
    health: row.health as HealthStatus,
    startDate: row.start_date,
    endDate: row.end_date,
  }));
}

export function getInitiativeById(id: string): Initiative | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM initiatives WHERE id = ?').get(id) as {
    id: string;
    code: string;
    title: string;
    description: string;
    priority: string;
    health: string;
    start_date: string;
    end_date: string;
  } | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    priority: row.priority as Initiative['priority'],
    health: row.health as HealthStatus,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

export function createInitiative(xmatrixId: string, data: Initiative): Initiative {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO initiatives (id, xmatrix_id, code, title, description, priority, health, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(data.id, xmatrixId, data.code, data.title, data.description, data.priority, data.health, data.startDate, data.endDate);
  return getInitiativeById(data.id)!;
}

export function updateInitiative(id: string, data: Partial<Initiative>): Initiative | null {
  const db = getDatabase();
  const current = getInitiativeById(id);
  if (!current) return null;
  
  const stmt = db.prepare(`
    UPDATE initiatives SET code = ?, title = ?, description = ?, priority = ?, health = ?, start_date = ?, end_date = ?
    WHERE id = ?
  `);
  
  stmt.run(
    data.code ?? current.code,
    data.title ?? current.title,
    data.description ?? current.description,
    data.priority ?? current.priority,
    data.health ?? current.health,
    data.startDate ?? current.startDate,
    data.endDate ?? current.endDate,
    id
  );
  
  return getInitiativeById(id);
}

export function deleteInitiative(id: string): boolean {
  const db = getDatabase();
  // Delete all relationships referencing this initiative (both source and target)
  db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?').run(id, id);
  const result = db.prepare('DELETE FROM initiatives WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ KPI CRUD ============

export function getKPIsByXMatrix(xmatrixId: string, year: number = new Date().getFullYear()): KPI[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM kpis WHERE xmatrix_id = ?').all(xmatrixId) as {
    id: string;
    code: string;
    title: string;
    unit: string;
    current_value: number;
    target_value: number;
    health: string;
    trend: string;
    owner_ids: string;
    start_date: string | null;
    end_date: string | null;
    target_distribution: string | null;
  }[];
  
  return rows.map(row => {
    const monthlyData = getMonthlyDataByKPI(row.id, year);
    const lowerBetter = isLowerBetter(row.unit, row.code);
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      unit: row.unit,
      currentValue: getCurrentValue(monthlyData),
      targetValue: row.target_value,
      health: deriveHealth(monthlyData, undefined, lowerBetter, row.target_value),
      trend: deriveTrend(monthlyData, lowerBetter),
      ownerIds: JSON.parse(row.owner_ids || '[]'),
      monthlyData: monthlyData,
      startDate: row.start_date ?? undefined,
      endDate: row.end_date ?? undefined,
      targetDistribution: (row.target_distribution as TargetDistribution) ?? 'equal',
    };
  });
}

export function getKPIById(id: string, year: number = new Date().getFullYear()): KPI | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM kpis WHERE id = ?').get(id) as {
    id: string;
    code: string;
    title: string;
    unit: string;
    current_value: number;
    target_value: number;
    health: string;
    trend: string;
    owner_ids: string;
    start_date: string | null;
    end_date: string | null;
    target_distribution: string | null;
  } | undefined;
  
  if (!row) return null;
  
  const monthlyData = getMonthlyDataByKPI(row.id, year);
  const lowerBetter = isLowerBetter(row.unit, row.code);
  
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    unit: row.unit,
    currentValue: getCurrentValue(monthlyData),
    targetValue: row.target_value,
    health: deriveHealth(monthlyData, undefined, lowerBetter, row.target_value),
    trend: deriveTrend(monthlyData, lowerBetter),
    ownerIds: JSON.parse(row.owner_ids || '[]'),
    monthlyData: monthlyData,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    targetDistribution: (row.target_distribution as TargetDistribution) ?? 'equal',
  };
}

export function createKPI(xmatrixId: string, data: KPI): KPI {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO kpis (id, xmatrix_id, code, title, unit, current_value, target_value, health, trend, owner_ids, start_date, end_date, target_distribution)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    data.id,
    xmatrixId,
    data.code,
    data.title,
    data.unit,
    data.currentValue,
    data.targetValue,
    data.health,
    data.trend,
    JSON.stringify(data.ownerIds),
    data.startDate ?? null,
    data.endDate ?? null,
    data.targetDistribution ?? 'equal'
  );
  
  // Insert monthly data
  if (data.monthlyData && data.monthlyData.length > 0) { //
    const defaultYear = data.startDate ? new Date(data.startDate).getFullYear() : new Date().getFullYear();
    const monthlyStmt = db.prepare(`
      INSERT INTO monthly_kpi_data (kpi_id, year, month, target, actual, variance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const monthly of data.monthlyData) { // we loop through each monthly data entry and insert it into the monthly_kpi_data table, associating it with the newly created KPI using data.id as the kpi_id foreign key. This ensures that all monthly data for the KPI is properly stored in the database right after the KPI itself is created.
      monthlyStmt.run(data.id, monthly.year ?? defaultYear, monthly.month, monthly.target, monthly.actual, monthly.variance);
    }
  }
  
  return getKPIById(data.id)!;
}

export function updateKPI(id: string, data: Partial<KPI> & { monthlyDataYear?: number }): KPI | null { 
  const db = getDatabase();
  const current = getKPIById(id);
  if (!current) return null;
  
  const stmt = db.prepare(` 
    UPDATE kpis SET code = ?, title = ?, unit = ?, current_value = ?, target_value = ?, health = ?, trend = ?, owner_ids = ?, start_date = ?, end_date = ?, target_distribution = ?
    WHERE id = ?
  `);
  
  stmt.run(
    data.code ?? current.code,
    data.title ?? current.title,
    data.unit ?? current.unit,
    data.currentValue ?? current.currentValue,
    data.targetValue ?? current.targetValue,
    data.health ?? current.health,
    data.trend ?? current.trend,
    JSON.stringify(data.ownerIds ?? current.ownerIds),
    data.startDate ?? current.startDate ?? null,
    data.endDate ?? current.endDate ?? null,
    data.targetDistribution ?? current.targetDistribution ?? 'equal',
    id
  );

  // If monthlyData is provided, update monthly KPI data
  if (data.monthlyData && Array.isArray(data.monthlyData) && data.monthlyData.length > 0) {
    const fallbackYear = current.startDate
      ? new Date(current.startDate).getFullYear()
      : new Date().getFullYear();
    const defaultYear = data.monthlyDataYear
      ?? data.monthlyData.find(m => typeof m.year === 'number')?.year
      ?? fallbackYear;
    const existingRows = db.prepare(
      'SELECT month, actual, variance FROM monthly_kpi_data WHERE kpi_id = ? AND year = ?'
    ).all(id, defaultYear) as { month: string; actual: number | null; variance: number | null }[];
    const existingByMonth = new Map(existingRows.map(r => [r.month, r]));
    const monthlyDeleteByKpiYear = db.prepare('DELETE FROM monthly_kpi_data WHERE kpi_id = ? AND year = ?');
    const monthlyInsert = db.prepare('INSERT INTO monthly_kpi_data (kpi_id, year, month, target, actual, variance) VALUES (?, ?, ?, ?, ?, ?)');
    
    monthlyDeleteByKpiYear.run(id, defaultYear);
    for (const m of data.monthlyData) {
      const existing = existingByMonth.get(m.month);
      const nextActual = m.actual ?? existing?.actual ?? null;
      const nextVariance = m.variance ?? existing?.variance ?? null;
      monthlyInsert.run(id, m.year ?? defaultYear, m.month, m.target, nextActual, nextVariance);
    }
  }
  
  return getKPIById(id);
}

export function deleteKPI(id: string): boolean {
  const db = getDatabase();
  // Delete all relationships referencing this KPI (both source and target)
  db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?').run(id, id);
  // Monthly data will be cascade deleted
  const result = db.prepare('DELETE FROM kpis WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ Monthly KPI Data ============

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getMonthlyDataByKPI(kpiId: string, year: number = new Date().getFullYear()): MonthlyKPIData[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM monthly_kpi_data WHERE kpi_id = ? AND year = ? ORDER BY id').all(kpiId, year) as {
    month: string;
    target: number;
    actual: number | null;
    variance: number | null;
  }[];

  const latestYear = db.prepare(
    'SELECT year FROM monthly_kpi_data WHERE kpi_id = ? AND year IS NOT NULL ORDER BY year DESC LIMIT 1'
  ).get(kpiId) as { year: number } | undefined;

  let targetTemplate = new Map<string, number>();
  if (rows.length === 0 && latestYear) {
    const latestRows = db.prepare(
      'SELECT month, target FROM monthly_kpi_data WHERE kpi_id = ? AND year = ? ORDER BY id'
    ).all(kpiId, latestYear.year) as { month: string; target: number }[];
    targetTemplate = new Map(latestRows.map(r => [r.month, r.target]));
  }
  
  const monthlyData = rows.map(row => ({
    year,
    month: row.month,
    target: row.target,
    actual: row.actual,
    variance: row.variance,
  }));

  // Ensure all 12 months exist with defaults for missing months
  const monthMap = new Map(monthlyData.map(m => [m.month, m]));
  
  return ALL_MONTHS.map(month => {
    const existing = monthMap.get(month);
    if (existing) return existing;
    return {
      year,
      month,
      target: targetTemplate.get(month) ?? 0,
      actual: null,
      variance: null,
    };
  });
}

// ============ Relationship CRUD ============

export function getRelationshipsByXMatrix(xmatrixId: string): Relationship[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM relationships WHERE xmatrix_id = ?').all(xmatrixId) as {
    source_id: string;
    source_type: string;
    target_id: string;
    target_type: string;
    strength: string;
  }[];
  
  return rows.map(row => ({
    sourceId: row.source_id,
    sourceType: row.source_type as Relationship['sourceType'],
    targetId: row.target_id,
    targetType: row.target_type as Relationship['targetType'],
    strength: row.strength as RelationshipStrength,
  }));
}

export function createRelationship(xmatrixId: string, data: Relationship): Relationship {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO relationships (xmatrix_id, source_id, source_type, target_id, target_type, strength)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(xmatrixId, data.sourceId, data.sourceType, data.targetId, data.targetType, data.strength);
  return data;
}

export function updateRelationship(xmatrixId: string, sourceId: string, targetId: string, strength: RelationshipStrength): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE relationships SET strength = ?
    WHERE xmatrix_id = ? AND source_id = ? AND target_id = ?
  `);
  
  const result = stmt.run(strength, xmatrixId, sourceId, targetId);
  return result.changes > 0;
}

export function deleteRelationship(xmatrixId: string, sourceId: string, targetId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM relationships 
    WHERE xmatrix_id = ? AND ((source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?))
  `);
  
  const result = stmt.run(xmatrixId, sourceId, targetId, targetId, sourceId);
  return result.changes > 0;
}

// ============ Bulk Sync (for edit mode save) ============

export function syncRelationships(xmatrixId: string, relationships: Relationship[]): void {
  const db = getDatabase();
  
  // Validate relationships array
  if (!Array.isArray(relationships)) {
    throw new Error('Relationships must be an array');
  }
  
  const deleteAll = db.prepare('DELETE FROM relationships WHERE xmatrix_id = ?'); 
  const insert = db.prepare(`
    INSERT INTO relationships (xmatrix_id, source_id, source_type, target_id, target_type, strength)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const syncTransaction = db.transaction(() => {  //db.transaction() returns a function that, when called, will execute the provided function within a database transaction. This means that all operations performed inside the function will either succeed together or fail together, ensuring data integrity. In this case, we are using it to first delete all existing relationships for the given xmatrixId and then insert the new set of relationships. If any part of this process fails (e.g., due to a database error), the entire transaction will be rolled back, preventing partial updates to the relationships data.
    deleteAll.run(xmatrixId);
    for (const rel of relationships) {
      if (!rel || !rel.sourceId || !rel.targetId) { 
        console.warn('Skipping invalid relationship:', rel);
        continue;
      }
      insert.run(xmatrixId, rel.sourceId, rel.sourceType, rel.targetId, rel.targetType, rel.strength);
    }
  });

  try {
    syncTransaction();
  } catch (error) {
    console.error('Error syncing relationships:', error, { xmatrixId, relationshipCount: relationships.length });
    throw error;
  }
}

export function bulkSyncEntities(xmatrixId: string, draft: XMatrixData, original: XMatrixData): void {
  const db = getDatabase();

  // Validate required data
  if (!draft || !original) {
    throw new Error('Draft and original data are required');
  }

  // Ensure relationships array exists
  if (!Array.isArray(draft.relationships)) {
    draft.relationships = [];
  }

  // Generic diff helper
  function diff<T extends { id: string }>(orig: T[], draftArr: T[]) {
    const origMap = new Map(orig.map(i => [i.id, i]));
    const draftMap = new Map(draftArr.map(i => [i.id, i]));
    const added: T[] = [];
    const updated: T[] = [];
    const deleted: T[] = [];
    for (const [id, item] of draftMap) {
      if (!origMap.has(id)) added.push(item);
      else if (JSON.stringify(origMap.get(id)) !== JSON.stringify(item)) updated.push(item);
    }
    for (const [id, item] of origMap) {
      if (!draftMap.has(id)) deleted.push(item);
    }
    return { added, updated, deleted };
  }

  const syncTransaction = db.transaction(() => {
    try {
      // --- Long-Term Objectives ---
      const ltoDiff = diff(original.longTermObjectives, draft.longTermObjectives);
      const ltoInsert = db.prepare('INSERT INTO long_term_objectives (id, xmatrix_id, code, title, description, timeframe, health) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const ltoUpdate = db.prepare('UPDATE long_term_objectives SET code=?, title=?, description=?, timeframe=?, health=? WHERE id=?');
      const ltoDelete = db.prepare('DELETE FROM long_term_objectives WHERE id=?');
      const ltoRelDelete = db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?');
      for (const e of ltoDiff.added) ltoInsert.run(e.id, xmatrixId, e.code, e.title, e.description, e.timeframe, e.health);
      for (const e of ltoDiff.updated) ltoUpdate.run(e.code, e.title, e.description, e.timeframe, e.health, e.id);
      for (const e of ltoDiff.deleted) {
        ltoRelDelete.run(e.id, e.id);
        ltoDelete.run(e.id);
      }

    // --- Annual Objectives ---
    const aoDiff = diff(original.annualObjectives, draft.annualObjectives);
    const aoInsert = db.prepare('INSERT INTO annual_objectives (id, xmatrix_id, code, title, description, year, health, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const aoUpdate = db.prepare('UPDATE annual_objectives SET code=?, title=?, description=?, year=?, health=?, progress=? WHERE id=?');
    const aoDelete = db.prepare('DELETE FROM annual_objectives WHERE id=?');
    const aoRelDelete = db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?');
    for (const e of aoDiff.added) aoInsert.run(e.id, xmatrixId, e.code, e.title, e.description, e.year, e.health, e.progress);
    for (const e of aoDiff.updated) aoUpdate.run(e.code, e.title, e.description, e.year, e.health, e.progress, e.id);
    for (const e of aoDiff.deleted) {
      aoRelDelete.run(e.id, e.id);
      aoDelete.run(e.id);
    }

    // --- Initiatives ---
    const initDiff = diff(original.initiatives, draft.initiatives);
    const initInsert = db.prepare('INSERT INTO initiatives (id, xmatrix_id, code, title, description, priority, health, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const initUpdate = db.prepare('UPDATE initiatives SET code=?, title=?, description=?, priority=?, health=?, start_date=?, end_date=? WHERE id=?');
    const initDelete = db.prepare('DELETE FROM initiatives WHERE id=?');
    const initRelDelete = db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?');
    for (const e of initDiff.added) initInsert.run(e.id, xmatrixId, e.code, e.title, e.description, e.priority, e.health, e.startDate, e.endDate);
    for (const e of initDiff.updated) initUpdate.run(e.code, e.title, e.description, e.priority, e.health, e.startDate, e.endDate, e.id);
    for (const e of initDiff.deleted) {
      initRelDelete.run(e.id, e.id);
      initDelete.run(e.id);
    }

    // --- KPIs ---
    const kpiDiff = diff(original.kpis, draft.kpis);
    const kpiInsert = db.prepare('INSERT INTO kpis (id, xmatrix_id, code, title, unit, current_value, target_value, health, trend, owner_ids, start_date, end_date, target_distribution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const kpiUpdate = db.prepare('UPDATE kpis SET code=?, title=?, unit=?, current_value=?, target_value=?, health=?, trend=?, owner_ids=?, start_date=?, end_date=?, target_distribution=? WHERE id=?');
    const kpiDelete = db.prepare('DELETE FROM kpis WHERE id=?');
    const kpiRelDelete = db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?');
    const monthlyInsert = db.prepare('INSERT INTO monthly_kpi_data (kpi_id, year, month, target, actual, variance) VALUES (?, ?, ?, ?, ?, ?)');
    const monthlyDeleteByKpiYear = db.prepare('DELETE FROM monthly_kpi_data WHERE kpi_id=? AND year=?');
    for (const e of kpiDiff.added) {
      kpiInsert.run(e.id, xmatrixId, e.code, e.title, e.unit, e.currentValue, e.targetValue, e.health, e.trend, JSON.stringify(e.ownerIds), e.startDate ?? null, e.endDate ?? null, e.targetDistribution ?? 'equal');
      const defaultYear = e.startDate ? new Date(e.startDate).getFullYear() : new Date().getFullYear();
      if (e.monthlyData) {
        for (const m of e.monthlyData) {
          monthlyInsert.run(e.id, m.year ?? defaultYear, m.month, m.target, m.actual, m.variance);
        }
      }
    }
    for (const e of kpiDiff.updated) {
      kpiUpdate.run(e.code, e.title, e.unit, e.currentValue, e.targetValue, e.health, e.trend, JSON.stringify(e.ownerIds), e.startDate ?? null, e.endDate ?? null, e.targetDistribution ?? 'equal', e.id);
      // Re-sync monthly data ONLY if monthlyData array is provided and non-empty
      // This prevents data loss when relationships are modified without touching monthlyData
      if (e.monthlyData && e.monthlyData.length > 0) {
        const fallbackYear = e.startDate ? new Date(e.startDate).getFullYear() : new Date().getFullYear();
        const monthlyYear = e.monthlyData.find(m => typeof m.year === 'number')?.year ?? fallbackYear;
        monthlyDeleteByKpiYear.run(e.id, monthlyYear);
        for (const m of e.monthlyData) {
          monthlyInsert.run(e.id, m.year ?? monthlyYear, m.month, m.target, m.actual, m.variance);
        }
      }
      // Otherwise, preserve existing monthly data from the database
    }
    for (const e of kpiDiff.deleted) {
      kpiRelDelete.run(e.id, e.id);
      kpiDelete.run(e.id);
    }

    // --- Owners ---
    const ownerDiff = diff(original.owners, draft.owners);
    const ownerInsert = db.prepare('INSERT INTO owners (id, xmatrix_id, name, role, avatar, initials, responsibility_type) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const ownerUpdate = db.prepare('UPDATE owners SET name=?, role=?, avatar=?, initials=?, responsibility_type=? WHERE id=?');
    const ownerDelete = db.prepare('DELETE FROM owners WHERE id=?');
    const ownerRelDelete = db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?');
    for (const e of ownerDiff.added) ownerInsert.run(e.id, xmatrixId, e.name, e.role, e.avatar, e.initials, e.responsibilityType);
    for (const e of ownerDiff.updated) ownerUpdate.run(e.name, e.role, e.avatar, e.initials, e.responsibilityType, e.id);
    for (const e of ownerDiff.deleted) {
      ownerRelDelete.run(e.id, e.id);
      ownerDelete.run(e.id);
    }

    // --- Relationships (full replace) ---
    syncRelationships(xmatrixId, draft.relationships);

    // --- XMatrix metadata ---
    const metaUpdate = db.prepare('UPDATE xmatrix SET name=?, vision=?, true_north=?, period_start=?, period_end=?, themes=? WHERE id=?');
    metaUpdate.run(draft.name, draft.vision, draft.trueNorth, draft.periodStart, draft.periodEnd, JSON.stringify(draft.themes), xmatrixId);
    } catch (txnError) {
      console.error('Transaction error details:', txnError);
      throw txnError;
    }
  });

  try {
    syncTransaction();
  } catch (error) {
    console.error('Failed to sync entities:', error);
    throw error;
  }
}

// ============ Utility Functions ============

/**
 * Find all orphaned relationships (relationships referencing deleted entities)
 * Returns array of relationship IDs that should be deleted
 */
export function findOrphanedRelationships(xmatrixId: string): Array<{ 
  id: number;
  sourceId: string;
  sourceMissing: boolean;
  targetId: string;
  targetMissing: boolean;
}> {
  const db = getDatabase();
  
  // Get all relationships for this xmatrix
  const relationships = db.prepare('SELECT id, source_id, source_type, target_id, target_type FROM relationships WHERE xmatrix_id = ?').all(xmatrixId) as Array<{
    id: number;
    source_id: string;
    source_type: string;
    target_id: string;
    target_type: string;
  }>;
  
  const orphaned: Array<{
    id: number;
    sourceId: string;
    sourceMissing: boolean;
    targetId: string;
    targetMissing: boolean;
  }> = [];
  
  for (const rel of relationships) {
    const tableName = rel.source_type === 'lto' ? 'long_term_objectives' :
                      rel.source_type === 'ao' ? 'annual_objectives' :
                      rel.source_type === 'initiative' ? 'initiatives' :
                      rel.source_type === 'kpi' ? 'kpis' :
                      rel.source_type === 'owner' ? 'owners' : null;
    
    const targetTableName = rel.target_type === 'lto' ? 'long_term_objectives' :
                            rel.target_type === 'ao' ? 'annual_objectives' :
                            rel.target_type === 'initiative' ? 'initiatives' :
                            rel.target_type === 'kpi' ? 'kpis' :
                            rel.target_type === 'owner' ? 'owners' : null;
    
    let sourceMissing = false;
    let targetMissing = false;
    
    if (tableName) {
      const source = db.prepare(`SELECT id FROM ${tableName} WHERE id = ?`).get(rel.source_id);
      sourceMissing = !source;
    }
    
    if (targetTableName) {
      const target = db.prepare(`SELECT id FROM ${targetTableName} WHERE id = ?`).get(rel.target_id);
      targetMissing = !target;
    }
    
    if (sourceMissing || targetMissing) {
      orphaned.push({
        id: rel.id,
        sourceId: rel.source_id,
        sourceMissing,
        targetId: rel.target_id,
        targetMissing,
      });
    }
  }
  
  return orphaned;
}

/**
 * Clean up all orphaned relationships for a given xmatrix
 * Returns number of relationships deleted
 */
export function cleanupOrphanedRelationships(xmatrixId: string): number {
  const db = getDatabase();
  const orphaned = findOrphanedRelationships(xmatrixId);
  
  if (orphaned.length === 0) return 0;
  
  const deleteStmt = db.prepare('DELETE FROM relationships WHERE id = ?');
  let count = 0;
  
  for (const rel of orphaned) {
    const result = deleteStmt.run(rel.id);
    if (result.changes > 0) count++;
  }
  
  return count;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
