// KPIs API Routes - GET all, POST new

import { NextRequest, NextResponse } from 'next/server';
import { getKPIsByXMatrix, createKPI } from '@/lib/db';

// GET /api/kpis - Get all KPIs for an XMatrix
export async function GET(request: NextRequest) {
    try {
        const xmatrixId = request.nextUrl.searchParams.get('xmatrixId');

        if (!xmatrixId) {
            return NextResponse.json(
                { error: 'Missing xmatrixId query parameter' },
                { status: 400 }
            );
        }

        const kpis = getKPIsByXMatrix(xmatrixId);
        return NextResponse.json(kpis);
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch KPIs' },
            { status: 500 }
        );
    }
}

// POST /api/kpis - Create new KPI
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.xmatrixId || !data.id || !data.title) {
            return NextResponse.json(
                { error: 'Missing required fields: xmatrixId, id, title' },
                { status: 400 }
            );
        }

        const kpi = createKPI(data.xmatrixId, {
            id: data.id,
            code: data.code || '',
            title: data.title,
            unit: data.unit || '%',
            currentValue: data.currentValue || 0,
            targetValue: data.targetValue || 100,
            health: data.health || 'on-track',
            trend: data.trend || 'stable',
            ownerIds: data.ownerIds || [],
            monthlyData: data.monthlyData || [],
        });

        return NextResponse.json(kpi, { status: 201 });
    } catch (error) {
        console.error('Error creating KPI:', error);
        return NextResponse.json(
            { error: 'Failed to create KPI' },
            { status: 500 }
        );
    }
}
