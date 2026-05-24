// Enterprise Hoshin Kanri X-Matrix Types


// MVP: Simplified to only Primary (direct/strong) and Secondary (supporting)
export type RelationshipStrength = 'none' | 'primary' | 'secondary';

export type EntityType = 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';

// Status Labels: on-track (green), at-risk (yellow), off-track (red)
export type HealthStatus = 'on-track' | 'at-risk' | 'off-track';

// Lifecycle status — Active = in progress, Done = KPI target reached
export type EntityStatus = 'active' | 'done';

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
  status?: EntityStatus;
  jiraEpicKey?: string;
  jiraEpicUrl?: string;
  jiraLastSynced?: number;
  jiraSyncStatus?: 'synced' | 'pending' | 'error';
  jiraSyncError?: string;
}

export interface AnnualObjective {
  id: string;
  code: string;
  title: string;
  description: string;
  year: number;
  health: HealthStatus;
  progress: number;
  status?: EntityStatus;
  jiraEpicKey?: string;
  jiraEpicUrl?: string;
  jiraLastSynced?: number;
  jiraSyncStatus?: 'synced' | 'pending' | 'error';
  jiraSyncError?: string;
}

export interface Initiative {
  id: string;
  code: string;
  title: string;
  description: string;
  priority: 'blocker' | 'critical' | 'major' | 'medium' | 'trivial';
  health: HealthStatus;
  status?: EntityStatus;
  startDate: string;
  endDate: string;
  jiraIssueType?: 'story' | 'task';
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  jiraLastSynced?: number;
  jiraSyncStatus?: 'synced' | 'pending' | 'error';
  jiraSyncError?: string;
}

export type TargetDistribution = 'equal' | 'linear' | 'front-loaded' | 'custom';

export const KPI_UNITS = [
  { value: '%', label: '% — Percentage' },
  { value: '$', label: '$ — US Dollar' },
  { value: '₹', label: '₹ — Indian Rupee' },
  { value: '€', label: '€ — Euro' },
  { value: '£', label: '£ — British Pound' },
  { value: '¥', label: '¥ — Japanese Yen' },
  { value: '#', label: '# — Count / Units' },
  { value: 'hrs', label: 'hrs — Hours' },
  { value: 'days', label: 'days — Days' },
  { value: 'pts', label: 'pts — Points' },
  { value: 'x', label: 'x — Multiplier / Ratio' },
  { value: 'NPS', label: 'NPS — Net Promoter Score' },
  { value: 'custom', label: 'custom — Other' },
] as const;

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
  /** ISO date strings for the KPI tracking window */
  startDate?: string;
  endDate?: string;
  /** How the annual target is split across active months */
  targetDistribution?: TargetDistribution;
}

export interface MonthlyKPIData {
  year?: number;
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
  statusFilter: EntityStatus | 'all';
}

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
};
