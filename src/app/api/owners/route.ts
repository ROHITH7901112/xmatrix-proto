// Owners API Routes - GET all, POST new

import { NextRequest, NextResponse } from 'next/server';
import { getOwnersByXMatrix, createOwner } from '@/lib/db';

// GET /api/owners - Get all owners for an XMatrix
export async function GET(request: NextRequest) {
    try {
        const xmatrixId = request.nextUrl.searchParams.get('xmatrixId');

        if (!xmatrixId) {
            return NextResponse.json(
                { error: 'Missing xmatrixId query parameter' },
                { status: 400 }
            );
        }

        const owners = getOwnersByXMatrix(xmatrixId);
        return NextResponse.json(owners);
    } catch (error) {
        console.error('Error fetching owners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch owners' },
            { status: 500 }
        );
    }
}

// POST /api/owners - Create new owner
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.xmatrixId || !data.id || !data.name) {
            return NextResponse.json(
                { error: 'Missing required fields: xmatrixId, id, name' },
                { status: 400 }
            );
        }

        const owner = createOwner(data.xmatrixId, {
            id: data.id,
            name: data.name,
            role: data.role || '',
            avatar: data.avatar || '',
            initials: data.initials || data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            responsibilityType: data.responsibilityType || 'responsible',
        });

        return NextResponse.json(owner, { status: 201 });
    } catch (error) {
        console.error('Error creating owner:', error);
        return NextResponse.json(
            { error: 'Failed to create owner' },
            { status: 500 }
        );
    }
}
