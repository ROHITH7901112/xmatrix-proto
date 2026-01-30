// Relationships API Routes - GET all, POST new, DELETE

import { NextRequest, NextResponse } from 'next/server';
import { getRelationshipsByXMatrix, createRelationship, updateRelationship, deleteRelationship } from '@/lib/db';

// GET /api/relationships - Get all relationships for an XMatrix
export async function GET(request: NextRequest) {
    try {
        const xmatrixId = request.nextUrl.searchParams.get('xmatrixId');

        if (!xmatrixId) {
            return NextResponse.json(
                { error: 'Missing xmatrixId query parameter' },
                { status: 400 }
            );
        }

        const relationships = getRelationshipsByXMatrix(xmatrixId);
        return NextResponse.json(relationships);
    } catch (error) {
        console.error('Error fetching relationships:', error);
        return NextResponse.json(
            { error: 'Failed to fetch relationships' },
            { status: 500 }
        );
    }
}

// POST /api/relationships - Create or update relationship
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.xmatrixId || !data.sourceId || !data.targetId || !data.sourceType || !data.targetType) {
            return NextResponse.json(
                { error: 'Missing required fields: xmatrixId, sourceId, targetId, sourceType, targetType' },
                { status: 400 }
            );
        }

        const relationship = createRelationship(data.xmatrixId, {
            sourceId: data.sourceId,
            sourceType: data.sourceType,
            targetId: data.targetId,
            targetType: data.targetType,
            strength: data.strength || 'primary',
        });

        return NextResponse.json(relationship, { status: 201 });
    } catch (error) {
        console.error('Error creating relationship:', error);
        return NextResponse.json(
            { error: 'Failed to create relationship' },
            { status: 500 }
        );
    }
}

// PUT /api/relationships - Update relationship strength
export async function PUT(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.xmatrixId || !data.sourceId || !data.targetId || !data.strength) {
            return NextResponse.json(
                { error: 'Missing required fields: xmatrixId, sourceId, targetId, strength' },
                { status: 400 }
            );
        }

        const updated = updateRelationship(data.xmatrixId, data.sourceId, data.targetId, data.strength);

        if (!updated) {
            return NextResponse.json(
                { error: 'Relationship not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating relationship:', error);
        return NextResponse.json(
            { error: 'Failed to update relationship' },
            { status: 500 }
        );
    }
}

// DELETE /api/relationships - Delete relationship
export async function DELETE(request: NextRequest) {
    try {
        const xmatrixId = request.nextUrl.searchParams.get('xmatrixId');
        const sourceId = request.nextUrl.searchParams.get('sourceId');
        const targetId = request.nextUrl.searchParams.get('targetId');

        if (!xmatrixId || !sourceId || !targetId) {
            return NextResponse.json(
                { error: 'Missing required query parameters: xmatrixId, sourceId, targetId' },
                { status: 400 }
            );
        }

        const deleted = deleteRelationship(xmatrixId, sourceId, targetId);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Relationship not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting relationship:', error);
        return NextResponse.json(
            { error: 'Failed to delete relationship' },
            { status: 500 }
        );
    }
}
