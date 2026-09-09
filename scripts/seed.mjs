// Seed del catalogo: popola la tabella hardware e genera le immagini locali.
// - Se un prodotto ha `image_urls` (fonti ufficiali), le scarica in data/images.
// - Se il download fallisce (o non ci sono URL), genera un placeholder SVG locale:
//   gli hotlink dai siti ufficiali si rompono, i file locali no.
//
// Uso: npm run seed   (idempotente, si può rilanciare in sicurezza)
// Nota: per aggiungere/modificare prodotti a runtime usa la dashboard /admin
// o le API admin: il seed non sovrascrive MAI i commenti.
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { placeholderSvg, tryDownload } from '../lib/placeholder.mjs';
import { PRODUCTS } from './seed-data.mjs';

const root = process.cwd();
const dbPath = process.env.DATABASE_PATH || path.join(root, 'data', 'hardware-hub.db');
// Le immagini vivono accanto al DB (data/images) e sono servite da /api/images/<file>:
// public/ in produzione serve solo i file presenti al build.
const imagesDir = path.join(path.dirname(dbPath), 'images');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

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
// Migrazione approved (come ensure-db)
const hwCols = db.prepare('PRAGMA table_info(hardware)').all();
if (!hwCols.some((c) => c.name === 'approved')) {
  db.exec('ALTER TABLE hardware ADD COLUMN approved INTEGER NOT NULL DEFAULT 1');
}

const upsert = db.prepare(`
  INSERT INTO hardware (slug, name, brand, category, price_eur, price_note, description, specs, images, buy_links)
  VALUES (@slug, @name, @brand, @category, @price_eur, @price_note, @description, @specs, @images, @buy_links)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    brand = excluded.brand,
    category = excluded.category,
    price_eur = excluded.price_eur,
    price_note = excluded.price_note,
    description = excluded.description,
    specs = excluded.specs,
    images = excluded.images,
    buy_links = excluded.buy_links
`);

let count = 0;
for (const product of PRODUCTS) {
  // 1) Immagini: download dalle fonti ufficiali se disponibili, altrimenti placeholder.
  const images = [];
  const remoteUrls = product.image_urls || [];
  for (let i = 0; i < remoteUrls.length; i++) {
    const ext = path.extname(new URL(remoteUrls[i]).pathname).split('?')[0] || '.jpg';
    const file = `${product.slug}-${i + 1}${['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg'}`;
    const dest = path.join(imagesDir, file);
    if (fs.existsSync(dest) || (await tryDownload(remoteUrls[i], dest))) {
      images.push(`/api/images/${file}`);
    } else {
      console.warn(`  ⚠ download fallito per ${product.slug} (${remoteUrls[i]}), uso placeholder`);
    }
  }
  if (images.length === 0) {
    const file = `${product.slug}.svg`;
    fs.writeFileSync(path.join(imagesDir, file), placeholderSvg(product));
    images.push(`/api/images/${file}`);
  }

  // 2) Upsert prodotto (i commenti non vengono toccati).
  upsert.run({
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price_eur: product.price_eur ?? null,
    price_note: product.price_note ?? null,
    description: product.description,
    specs: JSON.stringify(product.specs),
    images: JSON.stringify(images),
    buy_links: JSON.stringify(product.buy_links || []),
  });
  count++;
  console.log(`  ✓ ${product.name}`);
}

console.log(`\nSeed completato: ${count} prodotti nel catalogo (${dbPath})`);
db.close();
