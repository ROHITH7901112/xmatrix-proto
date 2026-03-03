// XMatrix API Routes - GET, PUT, DELETE, PATCH by ID

import { NextRequest, NextResponse } from 'next/server';
import { getXMatrixById, updateXMatrix, deleteXMatrix, bulkSyncEntities } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/xmatrix/[id] - Get single XMatrix
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const matrix = getXMatrixById(id);

        if (!matrix) {
            return NextResponse.json(
                { error: 'XMatrix not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(matrix);
    } catch (error) {
        console.error('Error fetching XMatrix:', error);
        return NextResponse.json(
            { error: 'Failed to fetch XMatrix' },
            { status: 500 }
        );
    }
}

// PUT /api/xmatrix/[id] - Update XMatrix
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await request.json();

        const updated = updateXMatrix(id, data);

        if (!updated) {
            return NextResponse.json(
                { error: 'XMatrix not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating XMatrix:', error);
        return NextResponse.json(
            { error: 'Failed to update XMatrix' },
            { status: 500 }
        );
    }
}

// DELETE /api/xmatrix/[id] - Delete XMatrix
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deleted = deleteXMatrix(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'XMatrix not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting XMatrix:', error);
        return NextResponse.json(
            { error: 'Failed to delete XMatrix' },
            { status: 500 }
        );
    }
}

// PATCH /api/xmatrix/[id] - Bulk sync all draft changes in a single atomic transaction
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { draft, original } = await request.json();

        if (!draft || !original) {
            return NextResponse.json(
                { error: 'Missing required fields: draft, original' },
                { status: 400 }
            );
        }

        // Atomic bulk sync: diffs entities + replaces relationships in one transaction
        bulkSyncEntities(id, draft, original);

        // Return freshly-read authoritative state from DB
        const saved = getXMatrixById(id);
        return NextResponse.json(saved);
    } catch (error) {
        console.error('Error syncing XMatrix:', error);
        return NextResponse.json(
            { error: 'Failed to sync XMatrix changes' },
            { status: 500 }
        );
    }
}
