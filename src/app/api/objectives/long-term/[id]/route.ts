// Long-Term Objective API Routes - GET, PUT, DELETE by ID

import { NextRequest, NextResponse } from 'next/server';
import { getLongTermObjectiveById, updateLongTermObjective, deleteLongTermObjective } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/objectives/long-term/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const objective = getLongTermObjectiveById(id);

        if (!objective) {
            return NextResponse.json(
                { error: 'Long-term objective not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(objective);
    } catch (error) {
        console.error('Error fetching LTO:', error);
        return NextResponse.json(
            { error: 'Failed to fetch long-term objective' },
            { status: 500 }
        );
    }
}

// PUT /api/objectives/long-term/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await request.json();

        const updated = updateLongTermObjective(id, data);

        if (!updated) {
            return NextResponse.json(
                { error: 'Long-term objective not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating LTO:', error);
        return NextResponse.json(
            { error: 'Failed to update long-term objective' },
            { status: 500 }
        );
    }
}

// DELETE /api/objectives/long-term/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deleted = deleteLongTermObjective(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Long-term objective not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting LTO:', error);
        return NextResponse.json(
            { error: 'Failed to delete long-term objective' },
            { status: 500 }
        );
    }
}
