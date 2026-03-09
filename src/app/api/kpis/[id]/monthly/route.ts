// filepath: src/app/api/kpis/[id]/monthly/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getKPIById } from '@/lib/db';
import { MonthlyKPIData } from '@/lib/types';

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to ensure all 12 months exist with defaults
function ensureAllMonths(stored: MonthlyKPIData[]): MonthlyKPIData[] {
  const monthMap = new Map(stored.map(m => [m.month, m]));
  
  return ALL_MONTHS.map(month => {
    const existing = monthMap.get(month);
    if (existing) return existing;
    return { month, target: 0, actual: null, variance: null };
  });
}

// GET /api/kpis/[id]/monthly?year=YYYY
// Returns 12-month array for the KPI. Missing months filled with defaults.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const year = request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString();

    const kpi = getKPIById(id);
    if (!kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }

    const db = getDatabase();
    const stored = db.prepare('SELECT * FROM monthly_kpi_data WHERE kpi_id = ?').all(id) as {
      id: number;
      kpi_id: string;
      month: string;
      target: number;
      actual: number | null;
      variance: number | null;
    }[];

    const monthlyData = stored.map(m => ({
      month: m.month,
      target: m.target,
      actual: m.actual,
      variance: m.variance,
    }));
    
    const fullYear = ensureAllMonths(monthlyData);

    return NextResponse.json({
      kpiId: id,
      year: parseInt(year),
      monthlyData: fullYear,
    });
  } catch (error) {
    console.error('Error fetching monthly KPI data:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly data' }, { status: 500 });
  }
}

// PUT /api/kpis/[id]/monthly
// Body: { monthlyData: [{ month, target?, actual? }, ...] }
// Upserts rows. Transactional. Idempotent.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { monthlyData } = body as { monthlyData: Partial<MonthlyKPIData>[] };

    if (!monthlyData || !Array.isArray(monthlyData)) {
      return NextResponse.json({ error: 'monthlyData array required' }, { status: 400 });
    }

    const kpi = getKPIById(id);
    if (!kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }

    const db = getDatabase();

    // Transactional upsert
    const upsert = db.transaction((items: Partial<MonthlyKPIData>[]) => {
      for (const item of items) {
        if (!item.month || !ALL_MONTHS.includes(item.month)) continue;

        // Check if row exists
        const existing = db.prepare(
          'SELECT id, target FROM monthly_kpi_data WHERE kpi_id = ? AND month = ?'
        ).get(id, item.month) as { id: number; target: number } | undefined;

        // Compute variance
        const target = item.target !== undefined ? item.target : (existing?.target ?? 0);
        const actual = item.actual !== undefined ? item.actual : null;
        const variance = actual !== null ? actual - target : null;

        if (existing) {
          // Update existing row
          const setClauses: string[] = [];
          const values: (string | number | null)[] = [];

          if (item.target !== undefined) {
            setClauses.push('target = ?');
            values.push(item.target);
          }
          if (item.actual !== undefined) {
            setClauses.push('actual = ?');
            values.push(item.actual);
          }
          setClauses.push('variance = ?');
          values.push(variance);
          values.push(existing.id);

          db.prepare(`UPDATE monthly_kpi_data SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
        } else {
          // Insert new row
          db.prepare(
            'INSERT INTO monthly_kpi_data (kpi_id, month, target, actual, variance) VALUES (?, ?, ?, ?, ?)'
          ).run(id, item.month, target, actual, variance);
        }
      }
    });

    upsert(monthlyData);

    // Re-fetch and return the updated full 12-month data
    const updated = db.prepare('SELECT * FROM monthly_kpi_data WHERE kpi_id = ?').all(id) as {
      id: number;
      kpi_id: string;
      month: string;
      target: number;
      actual: number | null;
      variance: number | null;
    }[];
    
    const updatedMonthlyData = updated.map(m => ({
      month: m.month,
      target: m.target,
      actual: m.actual,
      variance: m.variance,
    }));
    
    const fullYear = ensureAllMonths(updatedMonthlyData);

    return NextResponse.json({
      kpiId: id,
      monthlyData: fullYear,
    });
  } catch (error) {
    console.error('Error updating monthly KPI data:', error);
    return NextResponse.json({ error: 'Failed to update monthly data' }, { status: 500 });
  }
}
