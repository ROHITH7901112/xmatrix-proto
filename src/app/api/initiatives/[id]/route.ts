// Initiative API Routes - GET, PUT, DELETE by ID

import { NextRequest, NextResponse } from 'next/server';
import { getInitiativeById, updateInitiative, deleteInitiative } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/initiatives/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const initiative = getInitiativeById(id);

        if (!initiative) {
            return NextResponse.json(
                { error: 'Initiative not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(initiative);
    } catch (error) {
        console.error('Error fetching initiative:', error);
        return NextResponse.json(
            { error: 'Failed to fetch initiative' },
            { status: 500 }
        );
    }
}

// PUT /api/initiatives/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await request.json();

        const updated = updateInitiative(id, data);

        if (!updated) {
            return NextResponse.json(
                { error: 'Initiative not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating initiative:', error);
        return NextResponse.json(
            { error: 'Failed to update initiative' },
            { status: 500 }
        );
    }
}

// DELETE /api/initiatives/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deleted = deleteInitiative(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Initiative not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting initiative:', error);
        return NextResponse.json(
            { error: 'Failed to delete initiative' },
            { status: 500 }
        );
    }
}
