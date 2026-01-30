// Long-Term Objectives API Routes - GET all, POST new

import { NextRequest, NextResponse } from 'next/server';
import { getLongTermObjectivesByXMatrix, createLongTermObjective } from '@/lib/db';

// GET /api/objectives/long-term - Get all LTOs for an XMatrix
export async function GET(request: NextRequest) {
    try {
        const xmatrixId = request.nextUrl.searchParams.get('xmatrixId');

        if (!xmatrixId) {
            return NextResponse.json(
                { error: 'Missing xmatrixId query parameter' },
                { status: 400 }
            );
        }

        const objectives = getLongTermObjectivesByXMatrix(xmatrixId);
        return NextResponse.json(objectives);
    } catch (error) {
        console.error('Error fetching LTOs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch long-term objectives' },
            { status: 500 }
        );
    }
}

// POST /api/objectives/long-term - Create new LTO
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.xmatrixId || !data.id || !data.title) {
            return NextResponse.json(
                { error: 'Missing required fields: xmatrixId, id, title' },
                { status: 400 }
            );
        }

        const objective = createLongTermObjective(data.xmatrixId, {
            id: data.id,
            code: data.code || '',
            title: data.title,
            description: data.description || '',
            timeframe: data.timeframe || '',
            health: data.health || 'on-track',
        });

        return NextResponse.json(objective, { status: 201 });
    } catch (error) {
        console.error('Error creating LTO:', error);
        return NextResponse.json(
            { error: 'Failed to create long-term objective' },
            { status: 500 }
        );
    }
}
