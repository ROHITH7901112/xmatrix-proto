// Seed script to populate the database with initial mock data

import {
    getDatabase,
    createXMatrix,
    createOwner,
    createLongTermObjective,
    createAnnualObjective,
    createInitiative,
    createKPI,
    createRelationship,
    getXMatrixById,
    closeDatabase
} from './db';
import { xMatrixData } from './mock-data';

export function seedDatabase(): void {
    const db = getDatabase();

    // Check if data already exists
    const existing = getXMatrixById(xMatrixData.id);
    if (existing) {
        console.log('Database already seeded, skipping...');
        return;
    }

    console.log('Seeding database with mock data...');

    // Use a transaction for atomic operations
    const transaction = db.transaction(() => {
        // 1. Create the XMatrix (without nested data)
        createXMatrix({
            id: xMatrixData.id,
            name: xMatrixData.name,
            vision: xMatrixData.vision,
            trueNorth: xMatrixData.trueNorth,
            periodStart: xMatrixData.periodStart,
            periodEnd: xMatrixData.periodEnd,
            themes: xMatrixData.themes,
        });

        // 2. Create Owners
        for (const owner of xMatrixData.owners) {
            createOwner(xMatrixData.id, owner);
        }

        // 3. Create Long-Term Objectives
        for (const lto of xMatrixData.longTermObjectives) {
            createLongTermObjective(xMatrixData.id, lto);
        }

        // 4. Create Annual Objectives
        for (const ao of xMatrixData.annualObjectives) {
            createAnnualObjective(xMatrixData.id, ao);
        }

        // 5. Create Initiatives
        for (const initiative of xMatrixData.initiatives) {
            createInitiative(xMatrixData.id, initiative);
        }

        // 6. Create KPIs (with monthly data)
        for (const kpi of xMatrixData.kpis) {
            createKPI(xMatrixData.id, kpi);
        }

        // 7. Create Relationships
        for (const relationship of xMatrixData.relationships) {
            createRelationship(xMatrixData.id, relationship);
        }
    });

    transaction();

    console.log('Database seeded successfully!');
}

// Auto-seed if run directly (for CLI usage)
if (typeof require !== 'undefined' && require.main === module) {
    seedDatabase();
    closeDatabase();
}
