// Annual Objectives API Routes - GET all, POST new

import { NextRequest, NextResponse } from 'next/server';
import { getAnnualObjectivesByXMatrix, createAnnualObjective } from '@/lib/db';

// GET /api/objectives/annual - Get all AOs for an XMatrix
export async function GET(request: NextRequest) {
    try {
        const xmatrixId = request.nextUrl.searchParams.get('xmatrixId');

        if (!xmatrixId) {
            return NextResponse.json(
                { error: 'Missing xmatrixId query parameter' },
                { status: 400 }
            );
        }

        const objectives = getAnnualObjectivesByXMatrix(xmatrixId);
        return NextResponse.json(objectives);
    } catch (error) {
        console.error('Error fetching AOs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch annual objectives' },
            { status: 500 }
        );
    }
}

// POST /api/objectives/annual - Create new AO
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.xmatrixId || !data.id || !data.title) {
            return NextResponse.json(
                { error: 'Missing required fields: xmatrixId, id, title' },
                { status: 400 }
            );
        }

        const objective = createAnnualObjective(data.xmatrixId, {
            id: data.id,
            code: data.code || '',
            title: data.title,
            description: data.description || '',
            year: data.year || new Date().getFullYear(),
            health: data.health || 'on-track',
            progress: data.progress || 0,
        });

        return NextResponse.json(objective, { status: 201 });
    } catch (error) {
        console.error('Error creating AO:', error);
        return NextResponse.json(
            { error: 'Failed to create annual objective' },
            { status: 500 }
        );
    }
}
