const Database = require('better-sqlite3');
const db = new Database('xmatrix.db');

console.log('Deleting orphaned KPI-Owner relationships...');

// Delete relationships between KPIs and Owners (these don't have a UI grid to manage them)
const deleted = db.prepare(`
  DELETE FROM relationships 
  WHERE (source_type = 'kpi' AND target_type = 'owner') 
     OR (source_type = 'owner' AND target_type = 'kpi')
`).run();

console.log(`Deleted ${deleted.changes} KPI-Owner relationships`);

// Show remaining relationships
console.log('\nRemaining relationships:');
const rels = db.prepare(`
  SELECT source_type, source_id, target_type, target_id, strength 
  FROM relationships 
  ORDER BY source_type, source_id
`).all();

rels.forEach(r => {
  console.log(`  ${r.source_type}(${r.source_id}) -> ${r.target_type}(${r.target_id}) [${r.strength}]`);
});

console.log(`\nTotal relationships remaining: ${rels.length}`);

db.close();
