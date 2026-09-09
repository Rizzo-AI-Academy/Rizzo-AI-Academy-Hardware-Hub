import { NextResponse } from 'next/server';
import { imagesDir } from '@/lib/placeholder.mjs';
import path from 'node:path';
import fs from 'node:fs';

export const dynamic = 'force-dynamic';

const CONTENT_TYPES = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/**
 * GET /api/images/<file> — serve le immagini dei prodotti da <data>/images.
 * Le immagini NON stanno in public/ perché in produzione Next.js serve solo
 * i file presenti al build; queste sono scritte a runtime (seed, upload admin).
 */
export async function GET(_request, { params }) {
  const { name } = await params;
  // Anti path-traversal: solo nomi semplici con estensione immagine nota
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes('..')) {
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
  }
  const ext = path.extname(name).toLowerCase();
  const type = CONTENT_TYPES[ext];
  if (!type) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

  const filePath = path.join(imagesDir(), name);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
  }
  const buf = fs.readFileSync(filePath);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
