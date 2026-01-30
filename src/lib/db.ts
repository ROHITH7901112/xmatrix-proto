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
  RelationshipStrength
} from './types';

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
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db!.exec(schema);
}

// ============ XMatrix CRUD ============

export function getAllXMatrices(): XMatrixData[] {
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

export function getXMatrixById(id: string): XMatrixData | null {
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
  
  stmt.run(
    data.name ?? current.name,
    data.vision ?? current.vision,
    data.trueNorth ?? current.trueNorth,
    data.periodStart ?? current.periodStart,
    data.periodEnd ?? current.periodEnd,
    JSON.stringify(data.themes ?? current.themes),
    id
  );
  
  return getXMatrixById(id);
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
  }[];
  
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
  
  return {
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
  return getLongTermObjectiveById(data.id)!;
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
  const result = db.prepare('DELETE FROM initiatives WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ KPI CRUD ============

export function getKPIsByXMatrix(xmatrixId: string): KPI[] {
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
  }[];
  
  return rows.map(row => ({
    id: row.id,
    code: row.code,
    title: row.title,
    unit: row.unit,
    currentValue: row.current_value,
    targetValue: row.target_value,
    health: row.health as HealthStatus,
    trend: row.trend as Trend,
    ownerIds: JSON.parse(row.owner_ids || '[]'),
    monthlyData: getMonthlyDataByKPI(row.id),
  }));
}

export function getKPIById(id: string): KPI | null {
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
  } | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    unit: row.unit,
    currentValue: row.current_value,
    targetValue: row.target_value,
    health: row.health as HealthStatus,
    trend: row.trend as Trend,
    ownerIds: JSON.parse(row.owner_ids || '[]'),
    monthlyData: getMonthlyDataByKPI(row.id),
  };
}

export function createKPI(xmatrixId: string, data: KPI): KPI {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO kpis (id, xmatrix_id, code, title, unit, current_value, target_value, health, trend, owner_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    JSON.stringify(data.ownerIds)
  );
  
  // Insert monthly data
  if (data.monthlyData && data.monthlyData.length > 0) {
    const monthlyStmt = db.prepare(`
      INSERT INTO monthly_kpi_data (kpi_id, month, target, actual, variance)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const monthly of data.monthlyData) {
      monthlyStmt.run(data.id, monthly.month, monthly.target, monthly.actual, monthly.variance);
    }
  }
  
  return getKPIById(data.id)!;
}

export function updateKPI(id: string, data: Partial<KPI>): KPI | null {
  const db = getDatabase();
  const current = getKPIById(id);
  if (!current) return null;
  
  const stmt = db.prepare(`
    UPDATE kpis SET code = ?, title = ?, unit = ?, current_value = ?, target_value = ?, health = ?, trend = ?, owner_ids = ?
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
    id
  );
  
  return getKPIById(id);
}

export function deleteKPI(id: string): boolean {
  const db = getDatabase();
  // Monthly data will be cascade deleted
  const result = db.prepare('DELETE FROM kpis WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ Monthly KPI Data ============

export function getMonthlyDataByKPI(kpiId: string): MonthlyKPIData[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM monthly_kpi_data WHERE kpi_id = ? ORDER BY id').all(kpiId) as {
    month: string;
    target: number;
    actual: number | null;
    variance: number | null;
  }[];
  
  return rows.map(row => ({
    month: row.month,
    target: row.target,
    actual: row.actual,
    variance: row.variance,
  }));
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

// ============ Utility Functions ============

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
