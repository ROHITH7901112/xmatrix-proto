import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'xmatrix.db');
console.log('DB_PATH:', DB_PATH);

try {
    const db = new Database(DB_PATH);
    console.log('Database opened successfully');

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables);

    if (tables.length > 0) {
        const matrices = db.prepare('SELECT * FROM xmatrix').all();
        console.log('XMatrices count:', matrices.length);
        console.log('XMatrices:', JSON.stringify(matrices, null, 2));
    } else {
        console.log('No tables found in database.');
    }

    db.close();
} catch (error) {
    console.error('Error debugging database:', error);
}
