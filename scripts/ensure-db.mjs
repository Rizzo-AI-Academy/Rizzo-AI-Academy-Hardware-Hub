// Garantisce che il database e le tabelle esistano prima dell'avvio del server.
// Viene eseguito automaticamente da `npm run dev` e `npm start`.
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'hardware-hub.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS hardware (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    price_eur REAL,
    price_note TEXT,
    description TEXT NOT NULL DEFAULT '',
    specs TEXT NOT NULL DEFAULT '{}',
    images TEXT NOT NULL DEFAULT '[]',
    buy_links TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hardware_id INTEGER NOT NULL REFERENCES hardware(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER,
    hidden INTEGER NOT NULL DEFAULT 0,
    ip_hash TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_comments_hardware ON comments(hardware_id, hidden, created_at DESC);
`);
db.close();
console.log(`Database pronto: ${dbPath}`);
