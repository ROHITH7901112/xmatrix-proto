#!/usr/bin/env node
/**
 * Migration Script: Fix Variance Calculation
 * 
 * Converts stored variance from percentage format to absolute difference.
 * Formula: variance = actual - target
 * 
 * Usage: node scripts/fix-variance.mjs
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'xmatrix.db');

console.log(`📁 Database path: ${dbPath}`);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

try {
  // Get all monthly data with actual and target values
  const rows = db.prepare(`
    SELECT 
      id,
      actual,
      target,
      variance
    FROM monthly_kpi_data
    WHERE actual IS NOT NULL
  `).all();

  console.log(`\n📊 Found ${rows.length} records with actual values`);

  if (rows.length === 0) {
    console.log('✅ No records to fix');
    process.exit(0);
  }

  // Analyze current variance values to detect if they're already in percentage format
  let percentageCount = 0;
  let absoluteCount = 0;
  let zeroVarianceCount = 0;

  const updateStmt = db.prepare(`
    UPDATE monthly_kpi_data
    SET variance = ?
    WHERE id = ?
  `);

  console.log('\n🔍 Analyzing and fixing variance values...\n');

  const updates = [];
  for (const row of rows) {
    const { id, actual, target, variance } = row;
    const correctVariance = actual - target;
    
    // Check if current variance looks like a percentage (typically between -1000 and 1000)
    const isLikelyPercentage = variance !== null && Math.abs(variance) > 100;
    
    if (variance === correctVariance) {
      absoluteCount++;
      console.log(`✓ ID ${id}: Already correct (${variance})`);
    } else if (isLikelyPercentage) {
      percentageCount++;
      updates.push({ id, oldVariance: variance, newVariance: correctVariance });
      console.log(`⚠ ID ${id}: Convert ${variance}% → ${correctVariance} (actual: ${actual}, target: ${target})`);
    } else if (Math.abs(correctVariance) < 0.01) {
      zeroVarianceCount++;
      console.log(`○ ID ${id}: Zero/negligible variance (${variance} → ${correctVariance})`);
    } else {
      updates.push({ id, oldVariance: variance, newVariance: correctVariance });
      console.log(`⚠ ID ${id}: Unexpected variance ${variance} → ${correctVariance}`);
    }
  }

  if (updates.length === 0) {
    console.log('\n✅ All variance values are already correct!');
    process.exit(0);
  }

  console.log(`\n📈 Summary:`);
  console.log(`  - Already correct: ${absoluteCount}`);
  console.log(`  - Need fixing: ${updates.length}`);
  console.log(`  - Zero/negligible: ${zeroVarianceCount}`);

  // Apply updates in a transaction
  console.log(`\n🔄 Applying ${updates.length} corrections...`);
  
  db.exec('BEGIN TRANSACTION');
  try {
    for (const { id, newVariance } of updates) {
      updateStmt.run(newVariance, id);
    }
    db.exec('COMMIT');
    console.log(`✅ Successfully updated ${updates.length} records`);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  console.log('\n🎉 Migration complete!');
} catch (err) {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
} finally {
  db.close();
}
