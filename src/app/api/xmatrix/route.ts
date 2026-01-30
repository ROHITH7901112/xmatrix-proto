// XMatrix API Routes - GET all, POST new

import { NextRequest, NextResponse } from 'next/server';
import { getAllXMatrices, createXMatrix, getXMatrixById, getDatabase } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

// Ensure database is initialized
function initDatabase() {
    getDatabase();
}

// GET /api/xmatrix - Get all XMatrices
export async function GET() {
    try {
        // Initialize database (creates tables if they don't exist)
        initDatabase();

        // Check if database has data
        const matrices = getAllXMatrices();

        if (matrices.length === 0 || (matrices.length > 0 && matrices[0].longTermObjectives.length === 0)) {
            // Seed database if empty or has no objectives
            seedDatabase();
            const seededMatrices = getAllXMatrices();
            return NextResponse.json(seededMatrices);
        }

        return NextResponse.json(matrices);
    } catch (error) {
        console.error('Error fetching XMatrices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch XMatrices' },
            { status: 500 }
        );
    }
}

// POST /api/xmatrix - Create new XMatrix
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.id || !data.name) {
            return NextResponse.json(
                { error: 'Missing required fields: id, name' },
                { status: 400 }
            );
        }

        // Check if XMatrix already exists
        const existing = getXMatrixById(data.id);
        if (existing) {
            return NextResponse.json(
                { error: 'XMatrix with this ID already exists' },
                { status: 409 }
            );
        }

        const matrix = createXMatrix({
            id: data.id,
            name: data.name,
            vision: data.vision || '',
            trueNorth: data.trueNorth || '',
            periodStart: data.periodStart || new Date().getFullYear(),
            periodEnd: data.periodEnd || new Date().getFullYear() + 3,
            themes: data.themes || [],
        });

        return NextResponse.json(matrix, { status: 201 });
    } catch (error) {
        console.error('Error creating XMatrix:', error);
        return NextResponse.json(
            { error: 'Failed to create XMatrix' },
            { status: 500 }
        );
    }
}
