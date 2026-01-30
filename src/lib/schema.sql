-- SQLite Schema for X-Matrix Hoshin Kanri Application

-- Main XMatrix table
CREATE TABLE IF NOT EXISTS xmatrix (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vision TEXT,
  true_north TEXT,
  period_start INTEGER,
  period_end INTEGER,
  themes TEXT -- JSON array stored as string
);

-- Owners table
CREATE TABLE IF NOT EXISTS owners (
  id TEXT PRIMARY KEY,
  xmatrix_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  avatar TEXT,
  initials TEXT,
  responsibility_type TEXT CHECK(responsibility_type IN ('accountable', 'responsible', 'consulted', 'informed')),
  FOREIGN KEY (xmatrix_id) REFERENCES xmatrix(id) ON DELETE CASCADE
);

-- Long-Term Objectives
CREATE TABLE IF NOT EXISTS long_term_objectives (
  id TEXT PRIMARY KEY,
  xmatrix_id TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  timeframe TEXT,
  health TEXT CHECK(health IN ('on-track', 'at-risk', 'off-track')),
  FOREIGN KEY (xmatrix_id) REFERENCES xmatrix(id) ON DELETE CASCADE
);

-- Annual Objectives
CREATE TABLE IF NOT EXISTS annual_objectives (
  id TEXT PRIMARY KEY,
  xmatrix_id TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  health TEXT CHECK(health IN ('on-track', 'at-risk', 'off-track')),
  progress REAL DEFAULT 0,
  FOREIGN KEY (xmatrix_id) REFERENCES xmatrix(id) ON DELETE CASCADE
);

-- Initiatives
CREATE TABLE IF NOT EXISTS initiatives (
  id TEXT PRIMARY KEY,
  xmatrix_id TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')),
  health TEXT CHECK(health IN ('on-track', 'at-risk', 'off-track')),
  start_date TEXT,
  end_date TEXT,
  FOREIGN KEY (xmatrix_id) REFERENCES xmatrix(id) ON DELETE CASCADE
);

-- KPIs
CREATE TABLE IF NOT EXISTS kpis (
  id TEXT PRIMARY KEY,
  xmatrix_id TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  unit TEXT,
  current_value REAL,
  target_value REAL,
  health TEXT CHECK(health IN ('on-track', 'at-risk', 'off-track')),
  trend TEXT CHECK(trend IN ('up', 'down', 'stable')),
  owner_ids TEXT, -- JSON array stored as string
  FOREIGN KEY (xmatrix_id) REFERENCES xmatrix(id) ON DELETE CASCADE
);

-- Monthly KPI Data
CREATE TABLE IF NOT EXISTS monthly_kpi_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kpi_id TEXT NOT NULL,
  month TEXT,
  target REAL,
  actual REAL,
  variance REAL,
  FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE
);

-- Relationships between entities
CREATE TABLE IF NOT EXISTS relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  xmatrix_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_type TEXT CHECK(source_type IN ('lto', 'ao', 'initiative', 'kpi', 'owner')),
  target_id TEXT NOT NULL,
  target_type TEXT CHECK(target_type IN ('lto', 'ao', 'initiative', 'kpi', 'owner')),
  strength TEXT CHECK(strength IN ('none', 'primary', 'secondary')),
  FOREIGN KEY (xmatrix_id) REFERENCES xmatrix(id) ON DELETE CASCADE,
  UNIQUE(xmatrix_id, source_id, target_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_owners_xmatrix ON owners(xmatrix_id);
CREATE INDEX IF NOT EXISTS idx_lto_xmatrix ON long_term_objectives(xmatrix_id);
CREATE INDEX IF NOT EXISTS idx_ao_xmatrix ON annual_objectives(xmatrix_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_xmatrix ON initiatives(xmatrix_id);
CREATE INDEX IF NOT EXISTS idx_kpis_xmatrix ON kpis(xmatrix_id);
CREATE INDEX IF NOT EXISTS idx_monthly_kpi ON monthly_kpi_data(kpi_id);
CREATE INDEX IF NOT EXISTS idx_relationships_xmatrix ON relationships(xmatrix_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
