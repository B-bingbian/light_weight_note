import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'notes.db');

let db: SqlJsDatabase;

async function initDatabase(): Promise<SqlJsDatabase> {
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing database from disk, or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Run schema (CREATE IF NOT EXISTS is idempotent)
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.run(schema);

  // Migration: add user_id column if notes table exists without it
  try {
    db.run('ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES users(id)');
  } catch {
    // Column already exists — safe to ignore
  }

  // Save schema changes to disk
  saveToDisk();

  return db;
}

function saveToDisk(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Helper: current datetime as ISO-like string (UTC)
function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export { initDatabase, getDb, saveToDisk, now };

