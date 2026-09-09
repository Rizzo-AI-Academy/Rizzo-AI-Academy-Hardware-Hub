// Seed del catalogo: popola la tabella hardware e genera le immagini locali.
// - Se un prodotto ha `image_urls` (fonti ufficiali), le scarica in public/hardware-images.
// - Se il download fallisce (o non ci sono URL), genera un placeholder SVG locale:
//   gli hotlink dai siti ufficiali si rompono, i file locali no.
//
// Uso: npm run seed   (idempotente, si può rilanciare in sicurezza)
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { PRODUCTS } from './seed-data.mjs';

const root = process.cwd();
const dbPath = process.env.DATABASE_PATH || path.join(root, 'data', 'hardware-hub.db');
const imagesDir = path.join(root, 'public', 'hardware-images');
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
`);

const PALETTES = [
  ['#1a2a52', '#5b8cff'],
  ['#2a1a52', '#8f6bff'],
  ['#0f3d3e', '#2dd4bf'],
  ['#3d2a0f', '#fbbf24'],
  ['#3d0f2a', '#f472b6'],
  ['#0f2a3d', '#38bdf8'],
];

function placeholderSvg(product) {
  const hash = crypto.createHash('md5').update(product.slug).digest()[0];
  const [c1, c2] = PALETTES[hash % PALETTES.length];
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="#0b0e14"/>
    </linearGradient>
  </defs>
  <rect width="960" height="600" fill="url(#g)"/>
  <circle cx="830" cy="90" r="180" fill="${c2}" opacity="0.12"/>
  <circle cx="120" cy="520" r="140" fill="${c2}" opacity="0.10"/>
  <rect x="330" y="180" width="300" height="180" rx="18" fill="none" stroke="${c2}" stroke-width="4" opacity="0.85"/>
  <rect x="392" y="240" width="176" height="60" rx="8" fill="${c2}" opacity="0.25"/>
  <text x="480" y="430" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="40" font-weight="700" fill="#e6eaf2">${esc(product.name)}</text>
  <text x="480" y="475" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="22" fill="#9aa5b8">${esc(product.brand)} · ${esc(product.category)}</text>
</svg>`;
}

async function tryDownload(url, dest) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (hardware-hub seed)' },
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 4096) return false; // troppo piccolo: probabilmente un errore
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
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
      images.push(`/hardware-images/${file}`);
    } else {
      console.warn(`  ⚠ download fallito per ${product.slug} (${remoteUrls[i]}), uso placeholder`);
    }
  }
  if (images.length === 0) {
    const file = `${product.slug}.svg`;
    fs.writeFileSync(path.join(imagesDir, file), placeholderSvg(product));
    images.push(`/hardware-images/${file}`);
  }

  // 2) Upsert prodotto.
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
