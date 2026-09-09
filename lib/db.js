import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'hardware-hub.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Singleton: in dev Next.js ricarica i moduli, teniamo la connessione in globalThis.
const globalForDb = globalThis;

export function getDb() {
  if (!globalForDb.__hardwareHubDb) {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
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
      CREATE TABLE IF NOT EXISTS captcha_challenges (
        nonce TEXT PRIMARY KEY,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS trap_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL DEFAULT '',
        method TEXT NOT NULL DEFAULT '',
        path TEXT NOT NULL DEFAULT '',
        user_agent TEXT NOT NULL DEFAULT '',
        headers TEXT NOT NULL DEFAULT '{}',
        body TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_trap_logs_created ON trap_logs(created_at DESC);
    `);
    // Migrazione: colonna `approved` (1 = visibile, 0 = in attesa di moderazione).
    // I prodotti esistenti/seed restano approvati; quelli inviati dagli utenti partono da 0.
    const cols = db.prepare('PRAGMA table_info(hardware)').all();
    if (!cols.some((c) => c.name === 'approved')) {
      db.exec('ALTER TABLE hardware ADD COLUMN approved INTEGER NOT NULL DEFAULT 1');
    }
    globalForDb.__hardwareHubDb = db;
  }
  return globalForDb.__hardwareHubDb;
}

export function parseHardware(row) {
  if (!row) return null;
  return {
    ...row,
    specs: safeJson(row.specs, {}),
    images: safeJson(row.images, []),
    buy_links: safeJson(row.buy_links, []),
  };
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function listHardware() {
  const db = getDb();
  return db
    .prepare(
      `SELECT h.*,
              COALESCE(AVG(c.rating), 0) AS avg_rating,
              COUNT(c.id) AS comments_count
       FROM hardware h
       LEFT JOIN comments c ON c.hardware_id = h.id AND c.hidden = 0
       WHERE h.approved = 1
       GROUP BY h.id
       ORDER BY h.category, h.brand, h.name`
    )
    .all()
    .map(parseHardware);
}

export function getHardwareBySlug(slug) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT h.*,
              COALESCE(AVG(c.rating), 0) AS avg_rating,
              COUNT(c.id) AS comments_count
       FROM hardware h
       LEFT JOIN comments c ON c.hardware_id = h.id AND c.hidden = 0
       WHERE h.slug = ? AND h.approved = 1
       GROUP BY h.id`
    )
    .get(slug);
  return parseHardware(row);
}

export function listComments(hardwareId) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, author_name, text, rating, created_at
       FROM comments
       WHERE hardware_id = ? AND hidden = 0
       ORDER BY datetime(created_at) DESC, id DESC`
    )
    .all(hardwareId);
}
