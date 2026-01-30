// Annual Objective API Routes - GET, PUT, DELETE by ID

import { NextRequest, NextResponse } from 'next/server';
import { getAnnualObjectiveById, updateAnnualObjective, deleteAnnualObjective } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/objectives/annual/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const objective = getAnnualObjectiveById(id);

        if (!objective) {
            return NextResponse.json(
                { error: 'Annual objective not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(objective);
    } catch (error) {
        console.error('Error fetching AO:', error);
        return NextResponse.json(
            { error: 'Failed to fetch annual objective' },
            { status: 500 }
        );
    }
}

// PUT /api/objectives/annual/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await request.json();

        const updated = updateAnnualObjective(id, data);

        if (!updated) {
            return NextResponse.json(
                { error: 'Annual objective not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating AO:', error);
        return NextResponse.json(
            { error: 'Failed to update annual objective' },
            { status: 500 }
        );
    }
}

// DELETE /api/objectives/annual/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deleted = deleteAnnualObjective(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Annual objective not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting AO:', error);
        return NextResponse.json(
            { error: 'Failed to delete annual objective' },
            { status: 500 }
        );
    }
}
