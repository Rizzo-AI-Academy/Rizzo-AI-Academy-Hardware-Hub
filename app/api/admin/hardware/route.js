import { NextResponse } from 'next/server';
import { getDb, parseHardware } from '@/lib/db';
import { isAdmin, passesOriginCheck } from '@/lib/admin-auth';
import { ensureLocalImage, slugify } from '@/lib/placeholder.mjs';
import { validateProductPayload } from '@/lib/validate-product';

export const dynamic = 'force-dynamic';

function guard(request, mutation = false) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (mutation && !passesOriginCheck(request)) {
    return NextResponse.json({ error: 'Origin non valida' }, { status: 403 });
  }
  return null;
}

/** GET /api/admin/hardware — lista completa per la dashboard (include conteggi reali). */
export async function GET(request) {
  const denied = guard(request);
  if (denied) return denied;
  const db = getDb();
  const hardware = db
    .prepare(
      `SELECT h.*,
              (SELECT COUNT(*) FROM comments c WHERE c.hardware_id = h.id) AS comments_total,
              (SELECT COUNT(*) FROM comments c WHERE c.hardware_id = h.id AND c.hidden = 1) AS comments_hidden
       FROM hardware h ORDER BY h.category, h.brand, h.name`
    )
    .all()
    .map(parseHardware);
  return NextResponse.json({ hardware });
}

/** POST /api/admin/hardware — crea un prodotto. Body: campi prodotto + image_url opzionale. */
export async function POST(request) {
  const denied = guard(request, true);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const { data, error } = validateProductPayload(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const slug = slugify(body.slug || data.name);
  if (!slug) return NextResponse.json({ error: 'Slug non valido.' }, { status: 400 });

  const db = getDb();
  if (db.prepare('SELECT id FROM hardware WHERE slug = ?').get(slug)) {
    return NextResponse.json({ error: `Esiste già un prodotto con slug "${slug}".` }, { status: 409 });
  }

  const images = await ensureLocalImage(
    { slug, name: data.name, brand: data.brand, category: data.category },
    typeof body.image_url === 'string' && body.image_url.startsWith('http') ? body.image_url : null
  );

  const result = db
    .prepare(
      `INSERT INTO hardware (slug, name, brand, category, price_eur, price_note, description, specs, images, buy_links)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      data.name,
      data.brand,
      data.category,
      data.price_eur ?? null,
      data.price_note ?? null,
      data.description ?? '',
      JSON.stringify(data.specs ?? {}),
      JSON.stringify(images),
      JSON.stringify(data.buy_links ?? [])
    );

  const created = parseHardware(
    db.prepare('SELECT * FROM hardware WHERE id = ?').get(result.lastInsertRowid)
  );
  return NextResponse.json({ ok: true, hardware: created }, { status: 201 });
}
