// KPI API Routes - GET, PUT, DELETE by ID

import { NextRequest, NextResponse } from 'next/server';
import { getKPIById, updateKPI, deleteKPI } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/kpis/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const yearParam = request.nextUrl.searchParams.get('year');
        const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
        const kpi = getKPIById(id, Number.isNaN(year) ? new Date().getFullYear() : year);

        if (!kpi) {
            return NextResponse.json(
                { error: 'KPI not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(kpi);
    } catch (error) {
        console.error('Error fetching KPI:', error);
        return NextResponse.json(
            { error: 'Failed to fetch KPI' },
            { status: 500 }
        );
    }
}

// PUT /api/kpis/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await request.json();

        const monthlyDataYear = typeof data.year === 'number' ? data.year : undefined;
        const updated = updateKPI(id, { ...data, monthlyDataYear });

        if (!updated) {
            return NextResponse.json(
                { error: 'KPI not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating KPI:', error);
        return NextResponse.json(
            { error: 'Failed to update KPI' },
            { status: 500 }
        );
    }
}

// DELETE /api/kpis/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deleted = deleteKPI(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'KPI not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting KPI:', error);
        return NextResponse.json(
            { error: 'Failed to delete KPI' },
            { status: 500 }
        );
    }
}
