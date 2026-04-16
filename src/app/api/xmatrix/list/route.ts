/**
 * GET /api/xmatrix/list
 * List all available X-Matrices for selection
 */

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();
    const xmatrices = db.prepare('SELECT id, name, period_start, period_end FROM xmatrix ORDER BY created_at DESC').all();

    return NextResponse.json({
      success: true,
      xmatrices: xmatrices.map((x: any) => ({
        id: x.id,
        name: x.name,
        periodStart: x.period_start,
        periodEnd: x.period_end,
      })),
    });
  } catch (error) {
    console.error('Failed to list X-Matrices:', error);
    return NextResponse.json(
      { error: 'Failed to list X-Matrices' },
      { status: 500 }
    );
  }
}
