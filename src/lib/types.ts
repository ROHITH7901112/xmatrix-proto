// Enterprise Hoshin Kanri X-Matrix Types

// MVP: Simplified to only Primary (direct/strong) and Secondary (supporting)
export type RelationshipStrength = 'none' | 'primary' | 'secondary';

export type EntityType = 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';

// Status Labels: completed (green), in-progress (yellow), delayed (red)
export type HealthStatus = 'on-track' | 'at-risk' | 'off-track';

export type Trend = 'up' | 'down' | 'stable';

export type ResponsibilityType = 'accountable' | 'responsible' | 'consulted' | 'informed';

// Matrix editing mode - View Mode is default (read-only), Edit Mode enables changes
export type MatrixMode = 'view' | 'edit';

// Edit mode state for draft management
export interface EditModeState {
  mode: MatrixMode;
  draftData: XMatrixData | null;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
}

export interface Owner {
  id: string;
  name: string;
  role: string;
  avatar: string;
  initials: string;
  responsibilityType: ResponsibilityType;
}

export interface LongTermObjective {
  id: string;
  code: string;
  title: string;
  description: string;
  timeframe: string;
  health: HealthStatus;
}

export interface AnnualObjective {
  id: string;
  code: string;
  title: string;
  description: string;
  year: number;
  health: HealthStatus;
  progress: number;
}

export interface Initiative {
  id: string;
  code: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  health: HealthStatus;
  startDate: string;
  endDate: string;
}

export interface KPI {
  id: string;
  code: string;
  title: string;
  unit: string;
  currentValue: number;
  targetValue: number;
  health: HealthStatus;
  trend: Trend;
  ownerIds: string[];
  monthlyData: MonthlyKPIData[];
}

export interface MonthlyKPIData {
  month: string;
  target: number;
  actual: number | null;
  variance: number | null;
}

export interface Relationship {
  sourceId: string;
  sourceType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';
  targetId: string;
  targetType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';
  strength: RelationshipStrength;
}

export interface XMatrixData {
  id: string;
  name: string;
  vision: string;
  trueNorth: string;
  periodStart: number;
  periodEnd: number;
  themes: string[];
  longTermObjectives: LongTermObjective[];
  annualObjectives: AnnualObjective[];
  initiatives: Initiative[];
  kpis: KPI[];
  owners: Owner[];
  relationships: Relationship[];
}

export interface ViewState {
  rotation: 0 | 90 | 180 | 270;
  selectedElement: SelectedElement | null;
  hoveredElement: HoveredElement | null;
  zoom: number;
  isDarkMode: boolean;
  sidebarCollapsed: boolean;
  timeHorizon: 'current' | 'future';
}

export interface SelectedElement {
  id: string;
  type: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner' | 'relationship';
}

export interface HoveredElement {
  id: string;
  type: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner' | 'relationship';
}

export interface FilterState {
  owners: string[];
  health: HealthStatus[];
  objectives: string[];
  timeRange: { start: string; end: string } | null;
}

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
};
