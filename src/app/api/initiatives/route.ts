// Initiatives API Routes - GET all, POST new

import { NextRequest, NextResponse } from 'next/server';
import { getInitiativesByXMatrix, createInitiative } from '@/lib/db';

// GET /api/initiatives - Get all initiatives for an XMatrix
export async function GET(request: NextRequest) {
    try {
        const xmatrixId = request.nextUrl.searchParams.get('xmatrixId');

        if (!xmatrixId) {
            return NextResponse.json(
                { error: 'Missing xmatrixId query parameter' },
                { status: 400 }
            );
        }

        const initiatives = getInitiativesByXMatrix(xmatrixId);
        return NextResponse.json(initiatives);
    } catch (error) {
        console.error('Error fetching initiatives:', error);
        return NextResponse.json(
            { error: 'Failed to fetch initiatives' },
            { status: 500 }
        );
    }
}

// POST /api/initiatives - Create new initiative
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.xmatrixId || !data.id || !data.title) {
            return NextResponse.json(
                { error: 'Missing required fields: xmatrixId, id, title' },
                { status: 400 }
            );
        }

        const initiative = createInitiative(data.xmatrixId, {
            id: data.id,
            code: data.code || '',
            title: data.title,
            description: data.description || '',
            priority: data.priority || 'medium',
            health: data.health || 'on-track',
            startDate: data.startDate || new Date().toISOString().split('T')[0],
            endDate: data.endDate || new Date().toISOString().split('T')[0],
        });

        return NextResponse.json(initiative, { status: 201 });
    } catch (error) {
        console.error('Error creating initiative:', error);
        return NextResponse.json(
            { error: 'Failed to create initiative' },
            { status: 500 }
        );
    }
}
