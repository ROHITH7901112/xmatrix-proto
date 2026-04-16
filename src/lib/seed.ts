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

// NOTE: This script is intentionally empty - no automatic seeding of mock data
// Use the API directly to create your X-Matrix data

export function seedDatabase(): void {
    // This function intentionally does nothing
    // Mock data seeding has been removed. Use the API to create X-Matrix data instead.
    console.log('seedDatabase() - No automatic seeding. Use API to create your data.');
}

// Auto-seed if run directly (for CLI usage)
if (typeof require !== 'undefined' && require.main === module) {
    seedDatabase();
    closeDatabase();
}
