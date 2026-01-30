// Owner API Routes - GET, PUT, DELETE by ID

import { NextRequest, NextResponse } from 'next/server';
import { getOwnerById, updateOwner, deleteOwner } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/owners/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const owner = getOwnerById(id);

        if (!owner) {
            return NextResponse.json(
                { error: 'Owner not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(owner);
    } catch (error) {
        console.error('Error fetching owner:', error);
        return NextResponse.json(
            { error: 'Failed to fetch owner' },
            { status: 500 }
        );
    }
}

// PUT /api/owners/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await request.json();

        const updated = updateOwner(id, data);

        if (!updated) {
            return NextResponse.json(
                { error: 'Owner not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating owner:', error);
        return NextResponse.json(
            { error: 'Failed to update owner' },
            { status: 500 }
        );
    }
}

// DELETE /api/owners/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deleted = deleteOwner(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Owner not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting owner:', error);
        return NextResponse.json(
            { error: 'Failed to delete owner' },
            { status: 500 }
        );
    }
}
