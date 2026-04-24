import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = './xmatrix.db';
const migrationPath = './migrate-initiatives.sql';

try {
  const db = new Database(dbPath);
  
  // Clean up from previous attempts
  try {
    db.exec('DROP TABLE IF EXISTS initiatives_backup');
  } catch(e) {}
  
  const migration = fs.readFileSync(migrationPath, 'utf-8');
  
  // Execute migration
  db.exec(migration);
  
  console.log('✅ Migration completed successfully!');
  
  // Verify new schema
  const result = db.prepare("PRAGMA table_info(initiatives)").all();
  console.log('\nInitiatives table schema:');
  result.forEach(col => {
    console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });
  
  db.close();
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
