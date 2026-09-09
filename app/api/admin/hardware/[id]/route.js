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

/** PATCH /api/admin/hardware/:id — aggiorna i campi forniti. `image_url` sostituisce l'immagine. */
export async function PATCH(request, { params }) {
  const denied = guard(request, true);
  if (denied) return denied;

  const { id } = await params;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM hardware WHERE id = ?').get(Number(id));
  if (!existing) return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  // Approvazione/rimozione dalla coda di moderazione (prodotti inviati dagli utenti)
  if (body.approved !== undefined) {
    const approved = body.approved ? 1 : 0;
    db.prepare('UPDATE hardware SET approved = ? WHERE id = ?').run(approved, existing.id);
    return NextResponse.json({
      ok: true,
      hardware: parseHardware(db.prepare('SELECT * FROM hardware WHERE id = ?').get(existing.id)),
    });
  }

  const { data, error } = validateProductPayload(body, { partial: true });
  if (error) return NextResponse.json({ error }, { status: 400 });

  const merged = {
    slug: existing.slug,
    name: data.name ?? existing.name,
    brand: data.brand ?? existing.brand,
    category: data.category ?? existing.category,
    price_eur: data.price_eur !== undefined ? data.price_eur : existing.price_eur,
    price_note: data.price_note !== undefined ? data.price_note : existing.price_note,
    description: data.description !== undefined ? data.description : existing.description,
    specs: data.specs ? JSON.stringify(data.specs) : existing.specs,
    images: existing.images,
    buy_links: data.buy_links ? JSON.stringify(data.buy_links) : existing.buy_links,
  };

  // Nuova immagine: scarica da URL oppure rigenera il placeholder se image_url === ""
  if (typeof body.image_url === 'string') {
    merged.images = JSON.stringify(
      await ensureLocalImage(
        { slug: merged.slug, name: merged.name, brand: merged.brand, category: merged.category },
        body.image_url.startsWith('http') ? body.image_url : null
      )
    );
  }

  // Cambio slug esplicito (opzionale, mantenere stabile per non rompere i link)
  if (body.slug) {
    const newSlug = slugify(body.slug);
    if (newSlug && newSlug !== existing.slug) {
      if (db.prepare('SELECT id FROM hardware WHERE slug = ?').get(newSlug)) {
        return NextResponse.json({ error: `Slug "${newSlug}" già in uso.` }, { status: 409 });
      }
      merged.slug = newSlug;
    }
  }

  db.prepare(
    `UPDATE hardware SET slug=@slug, name=@name, brand=@brand, category=@category,
       price_eur=@price_eur, price_note=@price_note, description=@description,
       specs=@specs, images=@images, buy_links=@buy_links
     WHERE id=@id`
  ).run({ ...merged, id: existing.id });

  return NextResponse.json({
    ok: true,
    hardware: parseHardware(db.prepare('SELECT * FROM hardware WHERE id = ?').get(existing.id)),
  });
}

/** DELETE /api/admin/hardware/:id — elimina il prodotto e (CASCADE) i suoi commenti. */
export async function DELETE(request, { params }) {
  const denied = guard(request, true);
  if (denied) return denied;

  const { id } = await params;
  const db = getDb();
  const result = db.prepare('DELETE FROM hardware WHERE id = ?').run(Number(id));
  if (result.changes === 0) {
    return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id: Number(id) });
}
