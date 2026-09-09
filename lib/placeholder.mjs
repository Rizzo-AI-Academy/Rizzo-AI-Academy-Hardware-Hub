// Generazione placeholder SVG e download immagini prodotti.
// Le immagini vivono in <dir del DATABASE_PATH>/images e sono servite da
// /api/images/<file>: public/ in produzione serve solo i file presenti al build,
// quindi i file scritti a runtime NON devono stare in public/.
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

/** Directory immagini persistente: accanto al file SQLite (stesso volume Docker). */
export function imagesDir() {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'hardware-hub.db');
  return path.join(path.dirname(dbPath), 'images');
}

const PALETTES = [
  ['#1a2a52', '#5b8cff'],
  ['#2a1a52', '#8f6bff'],
  ['#0f3d3e', '#2dd4bf'],
  ['#3d2a0f', '#fbbf24'],
  ['#3d0f2a', '#f472b6'],
  ['#0f2a3d', '#38bdf8'],
];

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function placeholderSvg(product) {
  const hash = crypto.createHash('md5').update(product.slug).digest()[0];
  const [c1, c2] = PALETTES[hash % PALETTES.length];
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

export function writePlaceholder(product, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = `${product.slug}.svg`;
  fs.writeFileSync(path.join(dir, file), placeholderSvg(product));
  return `/api/images/${file}`;
}

export async function tryDownload(url, dest) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (hardware-hub)' },
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 4096) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

/**
 * Garantisce un'immagine locale per il prodotto:
 * scarica `imageUrl` se fornito, altrimenti genera il placeholder SVG.
 * @returns {Promise<string[]>} path pubblici (es. ["/api/images/mac-mini-m4.svg"])
 */
export async function ensureLocalImage(product, imageUrl) {
  const dir = imagesDir();
  if (imageUrl) {
    let ext = '.jpg';
    try {
      ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
    } catch {
      /* URL malformato: fallback su placeholder */
    }
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) ext = '.jpg';
    const file = `${product.slug}-1${ext}`;
    const dest = path.join(dir, file);
    if (fs.existsSync(dest) || (await tryDownload(imageUrl, dest))) {
      return [`/api/images/${file}`];
    }
  }
  return [writePlaceholder(product, dir)];
}

/** Slug URL-safe da un nome (es. "Mac mini M4 Pro" → "mac-mini-m4-pro"). */
export function slugify(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
