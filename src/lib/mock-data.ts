// Enterprise Mock Data for Hoshin Kanri X-Matrix

import { XMatrixData, Owner, LongTermObjective, AnnualObjective, Initiative, KPI, Relationship, MonthlyKPIData } from './types';

const generateMonthlyData = (baseTarget: number, variance: number = 0.1): MonthlyKPIData[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = 0; // January 2026
  
  return months.map((month, index) => {
    const target = baseTarget + (index * baseTarget * 0.02);
    const hasActual = index <= currentMonth;
    const actual = hasActual 
      ? target * (1 + (Math.random() * variance * 2 - variance))
      : null;
    
    return {
      month,
      target: Math.round(target * 100) / 100,
      actual: actual !== null ? Math.round(actual * 100) / 100 : null,
      variance: actual !== null ? Math.round(((actual - target) / target) * 100) : null,
    };
  });
};

export const owners: Owner[] = [
  { id: 'owner-1', name: 'Naresh', role: 'Chief Strategy Officer', avatar: '', initials: 'SC', responsibilityType: 'accountable' },
  { id: 'owner-2', name: 'Rohith', role: 'VP Operations', avatar: '', initials: 'MR', responsibilityType: 'responsible' },
  { id: 'owner-3', name: 'Aarthi', role: 'Director of Innovation', avatar: '', initials: 'EW', responsibilityType: 'responsible' },
  { id: 'owner-4', name: 'Shibi', role: 'CFO', avatar: '', initials: 'DK', responsibilityType: 'accountable' },
  { id: 'owner-5', name: 'Mukilan', role: 'VP Customer Success', avatar: '', initials: 'LT', responsibilityType: 'responsible' },
  { id: 'owner-6', name: 'Rethik', role: 'CTO', avatar: '', initials: 'JM', responsibilityType: 'accountable' },
  { id: 'owner-7', name: 'Savio', role: 'Director of HR', avatar: '', initials: 'AF', responsibilityType: 'consulted' },
  { id: 'owner-8', name: 'Haswanth', role: 'VP Sales', avatar: '', initials: 'HS', responsibilityType: 'responsible' },
];

export const longTermObjectives: LongTermObjective[] = [
  { id: 'lto-1', code: 'LTO-1', title: 'Market Leadership in Enterprise Solutions', description: 'Achieve top 3 market position in enterprise software by 2028', timeframe: '2025-2028', health: 'on-track' },
  { id: 'lto-2', code: 'LTO-2', title: 'Operational Excellence & Efficiency', description: 'Reduce operational costs by 30% while improving quality metrics', timeframe: '2025-2028', health: 'at-risk' },
  { id: 'lto-3', code: 'LTO-3', title: 'Customer-Centric Innovation', description: 'Launch 5 breakthrough products driven by customer insights', timeframe: '2025-2028', health: 'on-track' },
  { id: 'lto-4', code: 'LTO-4', title: 'Sustainable Growth & Profitability', description: 'Achieve 25% CAGR with improving profit margins', timeframe: '2025-2028', health: 'on-track' },
];

export const annualObjectives: AnnualObjective[] = [
  { id: 'ao-1', code: 'AO-1', title: 'Expand Enterprise Client Base', description: 'Increase Fortune 500 clients from 45 to 75', year: 2026, health: 'on-track', progress: 35 },
  { id: 'ao-2', code: 'AO-2', title: 'Implement Lean Operations', description: 'Deploy lean methodology across all departments', year: 2026, health: 'at-risk', progress: 22 },
  { id: 'ao-3', code: 'AO-3', title: 'Launch AI-Powered Platform', description: 'Release next-generation AI analytics platform', year: 2026, health: 'on-track', progress: 48 },
  { id: 'ao-4', code: 'AO-4', title: 'Achieve Revenue Target $150M', description: 'Grow annual recurring revenue to $150M', year: 2026, health: 'on-track', progress: 28 },
  { id: 'ao-5', code: 'AO-5', title: 'Improve Customer Retention', description: 'Increase customer retention rate to 95%', year: 2026, health: 'on-track', progress: 67 },
];

export const initiatives: Initiative[] = [
  { id: 'init-1', code: 'I-1', title: 'Enterprise Sales Acceleration Program', description: 'Restructure sales team and implement account-based marketing', priority: 'critical', health: 'on-track', startDate: '2026-01-01', endDate: '2026-06-30' },
  { id: 'init-2', code: 'I-2', title: 'Process Optimization Initiative', description: 'Identify and eliminate waste across value streams', priority: 'high', health: 'at-risk', startDate: '2026-02-01', endDate: '2026-12-31' },
  { id: 'init-3', code: 'I-3', title: 'AI/ML Platform Development', description: 'Build and deploy machine learning capabilities', priority: 'critical', health: 'on-track', startDate: '2026-01-15', endDate: '2026-09-30' },
  { id: 'init-4', code: 'I-4', title: 'Customer Success Transformation', description: 'Implement proactive customer success methodology', priority: 'high', health: 'on-track', startDate: '2026-03-01', endDate: '2026-08-31' },
  { id: 'init-5', code: 'I-5', title: 'Strategic Partnership Program', description: 'Establish key technology and channel partnerships', priority: 'medium', health: 'on-track', startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: 'init-6', code: 'I-6', title: 'Digital Infrastructure Modernization', description: 'Migrate to cloud-native architecture', priority: 'high', health: 'on-track', startDate: '2026-04-01', endDate: '2026-11-30' },
];

export const kpis: KPI[] = [
  { id: 'kpi-1', code: 'K-1', title: 'Enterprise Win Rate', unit: '%', currentValue: 42, targetValue: 55, health: 'at-risk', trend: 'up', ownerIds: ['owner-8'], monthlyData: generateMonthlyData(40, 0.08) },
  { id: 'kpi-2', code: 'K-2', title: 'Operational Cost Ratio', unit: '%', currentValue: 68, targetValue: 60, health: 'at-risk', trend: 'down', ownerIds: ['owner-2'], monthlyData: generateMonthlyData(70, 0.05) },
  { id: 'kpi-3', code: 'K-3', title: 'Product NPS Score', unit: 'pts', currentValue: 72, targetValue: 80, health: 'on-track', trend: 'up', ownerIds: ['owner-3', 'owner-6'], monthlyData: generateMonthlyData(70, 0.06) },
  { id: 'kpi-4', code: 'K-4', title: 'Annual Recurring Revenue', unit: '$M', currentValue: 38.5, targetValue: 150, health: 'on-track', trend: 'up', ownerIds: ['owner-4', 'owner-8'], monthlyData: generateMonthlyData(12, 0.1) },
  { id: 'kpi-5', code: 'K-5', title: 'Customer Retention Rate', unit: '%', currentValue: 91, targetValue: 95, health: 'on-track', trend: 'stable', ownerIds: ['owner-5'], monthlyData: generateMonthlyData(90, 0.03) },
  { id: 'kpi-6', code: 'K-6', title: 'Time to Market', unit: 'days', currentValue: 95, targetValue: 60, health: 'at-risk', trend: 'down', ownerIds: ['owner-6'], monthlyData: generateMonthlyData(100, 0.1) },
  { id: 'kpi-7', code: 'K-7', title: 'Employee Engagement Score', unit: '%', currentValue: 78, targetValue: 85, health: 'on-track', trend: 'up', ownerIds: ['owner-7'], monthlyData: generateMonthlyData(75, 0.04) },
];

export const relationships: Relationship[] = [
  // LTO to AO relationships (Primary = direct alignment, Secondary = supporting)
  { sourceId: 'lto-1', sourceType: 'lto', targetId: 'ao-1', targetType: 'ao', strength: 'secondary' },
  { sourceId: 'lto-1', sourceType: 'lto', targetId: 'ao-4', targetType: 'ao', strength: 'primary' },
  { sourceId: 'lto-2', sourceType: 'lto', targetId: 'ao-2', targetType: 'ao', strength: 'primary' },
  { sourceId: 'lto-3', sourceType: 'lto', targetId: 'ao-3', targetType: 'ao', strength: 'primary' },
  { sourceId: 'lto-3', sourceType: 'lto', targetId: 'ao-5', targetType: 'ao', strength: 'secondary' },
  { sourceId: 'lto-4', sourceType: 'lto', targetId: 'ao-4', targetType: 'ao', strength: 'primary' },
  { sourceId: 'lto-4', sourceType: 'lto', targetId: 'ao-1', targetType: 'ao', strength: 'secondary' },
  
  // AO to Initiative relationships
  { sourceId: 'ao-1', sourceType: 'ao', targetId: 'init-1', targetType: 'initiative', strength: 'primary' },
  { sourceId: 'ao-1', sourceType: 'ao', targetId: 'init-5', targetType: 'initiative', strength: 'secondary' },
  { sourceId: 'ao-2', sourceType: 'ao', targetId: 'init-2', targetType: 'initiative', strength: 'primary' },
  { sourceId: 'ao-2', sourceType: 'ao', targetId: 'init-6', targetType: 'initiative', strength: 'secondary' },
  { sourceId: 'ao-3', sourceType: 'ao', targetId: 'init-3', targetType: 'initiative', strength: 'primary' },
  { sourceId: 'ao-3', sourceType: 'ao', targetId: 'init-6', targetType: 'initiative', strength: 'secondary' },
  { sourceId: 'ao-4', sourceType: 'ao', targetId: 'init-1', targetType: 'initiative', strength: 'secondary' },
  { sourceId: 'ao-5', sourceType: 'ao', targetId: 'init-4', targetType: 'initiative', strength: 'primary' },
  
  // Initiative to KPI relationships
  { sourceId: 'init-1', sourceType: 'initiative', targetId: 'kpi-1', targetType: 'kpi', strength: 'primary' },
  { sourceId: 'init-1', sourceType: 'initiative', targetId: 'kpi-4', targetType: 'kpi', strength: 'secondary' },
  { sourceId: 'init-2', sourceType: 'initiative', targetId: 'kpi-2', targetType: 'kpi', strength: 'primary' },
  { sourceId: 'init-2', sourceType: 'initiative', targetId: 'kpi-6', targetType: 'kpi', strength: 'secondary' },
  { sourceId: 'init-3', sourceType: 'initiative', targetId: 'kpi-3', targetType: 'kpi', strength: 'secondary' },
  { sourceId: 'init-3', sourceType: 'initiative', targetId: 'kpi-6', targetType: 'kpi', strength: 'primary' },
  { sourceId: 'init-4', sourceType: 'initiative', targetId: 'kpi-5', targetType: 'kpi', strength: 'primary' },
  { sourceId: 'init-4', sourceType: 'initiative', targetId: 'kpi-3', targetType: 'kpi', strength: 'secondary' },
  { sourceId: 'init-5', sourceType: 'initiative', targetId: 'kpi-4', targetType: 'kpi', strength: 'secondary' },
  { sourceId: 'init-6', sourceType: 'initiative', targetId: 'kpi-2', targetType: 'kpi', strength: 'secondary' },
  { sourceId: 'init-6', sourceType: 'initiative', targetId: 'kpi-7', targetType: 'kpi', strength: 'secondary' },
];

export const xMatrixData: XMatrixData = {
  id: 'xmatrix-2026',
  name: 'Strategy 2026',
  vision: 'To be the world\'s most trusted enterprise software partner',
  trueNorth: 'Customer Success Through Innovation',
  periodStart: 2026,
  periodEnd: 2028,
  themes: ['Digital Transformation', 'Operational Excellence', 'Customer Centricity'],
  longTermObjectives,
  annualObjectives,
  initiatives,
  kpis,
  owners,
  relationships,
};
