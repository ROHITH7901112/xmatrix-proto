const Database = require('better-sqlite3');

const db = new Database('xmatrix.db');

const aoRows = db
  .prepare("SELECT id, title FROM annual_objectives WHERE title = 'ao4' OR lower(title) LIKE '%ao4%'")
  .all();
const kpiRows = db
  .prepare("SELECT id, title FROM kpis WHERE title = 'newwww' OR lower(title) LIKE '%newwww%'")
  .all();
const initRows = db.prepare('SELECT id, title FROM initiatives').all();
const rels = db
  .prepare('SELECT source_id, source_type, target_id, target_type, strength FROM relationships')
  .all();

console.log('AO matches', aoRows);
console.log('KPI matches', kpiRows);
console.log('Initiatives', initRows);
console.log('Total relationships', rels.length);

if (aoRows[0] && kpiRows[0]) {
  const aoId = aoRows[0].id;
  const kpiId = kpiRows[0].id;

  const relsForAo = rels.filter((r) => r.source_id === aoId || r.target_id === aoId);
  const relsForKpi = rels.filter((r) => r.source_id === kpiId || r.target_id === kpiId);

  console.log('\nRelationships touching AO:', relsForAo);
  console.log('\nRelationships touching KPI:', relsForKpi);
}
