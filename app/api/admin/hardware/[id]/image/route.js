import { NextResponse } from 'next/server';
import { getDb, parseHardware } from '@/lib/db';
import { isAdmin, passesOriginCheck } from '@/lib/admin-auth';
import { imagesDir } from '@/lib/placeholder.mjs';
import path from 'node:path';
import fs from 'node:fs';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/admin/hardware/:id/image — carica un'immagine per un prodotto esistente.
 *
 * multipart/form-data con campo `image` (file png/jpeg/webp, max 5MB).
 * Pensato per gli agenti AI: curl -F "image=@foto.jpg" ...
 * Per scaricare da un URL remoto invece esiste già PATCH /api/admin/hardware/:id
 * con { "image_url": "https://..." }.
 */
export async function POST(request, { params }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (!passesOriginCheck(request)) {
    return NextResponse.json({ error: 'Origin non valida' }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const hw = db.prepare('SELECT * FROM hardware WHERE id = ?').get(Number(id));
  if (!hw) return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Invia multipart/form-data con il campo "image".' },
      { status: 400 }
    );
  }
  const file = form.get('image');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Campo "image" (file) mancante.' }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'Formato non supportato: usa PNG, JPEG o WebP.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Immagine troppo grande (max 5MB).' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dir = imagesDir();
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${hw.slug}-upload${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);

  const publicPath = `/api/images/${filename}`;
  db.prepare('UPDATE hardware SET images = ? WHERE id = ?').run(
    JSON.stringify([publicPath]),
    hw.id
  );

  return NextResponse.json({
    ok: true,
    image: publicPath,
    hardware: parseHardware(db.prepare('SELECT * FROM hardware WHERE id = ?').get(hw.id)),
  });
}
