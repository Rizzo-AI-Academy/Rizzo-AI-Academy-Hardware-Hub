import { NextResponse } from 'next/server';
import { getDb, listHardware, parseHardware } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security';
import { verifyCaptcha } from '@/lib/captcha';
import { ensureLocalImage, slugify } from '@/lib/placeholder.mjs';
import { validateProductPayload } from '@/lib/validate-product';

export const dynamic = 'force-dynamic';

// Categorie ammesse per gli inserimenti pubblici (l'admin può sempre correggere dopo).
const ALLOWED_CATEGORIES = ['Apple', 'Mini PC', 'Mini PC Windows', 'Workstation', 'Schede sviluppo'];

// Anti-abuso: max 3 inserimenti per ora per IP.
const SUBMIT_LIMIT = 3;
const SUBMIT_WINDOW_MS = 60 * 60_000;

export async function GET() {
  return NextResponse.json({ hardware: listHardware() });
}

/**
 * POST /api/hardware — inserimento pubblico di un PC (nessun login).
 * Protezioni: honeypot, captcha "Non sono un robot", rate limit per IP,
 * sanitizzazione/validazione input. Il prodotto entra in coda di moderazione
 * (approved = 0) e diventa visibile solo dopo l'approvazione admin.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  // Honeypot: gli utenti reali non vedono/compilano questo campo.
  if (body.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const captcha = verifyCaptcha(body.captcha);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const { data, error } = validateProductPayload(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  if (!ALLOWED_CATEGORIES.includes(data.category)) {
    return NextResponse.json(
      { error: `Categoria non valida. Scegli tra: ${ALLOWED_CATEGORIES.join(', ')}.` },
      { status: 400 }
    );
  }
  if (!data.description || data.description.length < 20) {
    return NextResponse.json(
      { error: 'Scrivi una descrizione di almeno 20 caratteri: aiuta la community a capire il prodotto.' },
      { status: 400 }
    );
  }

  const slug = slugify(data.name);
  if (!slug) return NextResponse.json({ error: 'Nome non valido.' }, { status: 400 });

  const db = getDb();
  if (db.prepare('SELECT id, approved FROM hardware WHERE slug = ?').get(slug)) {
    return NextResponse.json(
      { error: 'Questo PC è già nel catalogo (o in attesa di approvazione): aggiungi un commento sulla sua scheda!' },
      { status: 409 }
    );
  }

  // Rate limit DOPO tutte le validazioni: i tentativi falliti (errori di validazione,
  // duplicati, captcha errato) NON consumano quota. Conta solo l'inserimento riuscito.
  const ip = clientIp(request);
  const key = `submit-hw:${ip}`;
  const peek = rateLimit(key, SUBMIT_LIMIT, SUBMIT_WINDOW_MS, { increment: false });
  if (!peek.allowed) {
    return NextResponse.json(
      { error: 'Hai già inviato diversi prodotti: riprova più tardi.' },
      { status: 429, headers: { 'Retry-After': String(peek.retryAfterSec) } }
    );
  }

  // Niente download da URL forniti dagli utenti (rischio SSRF): placeholder locale automatico.
  const images = await ensureLocalImage(
    { slug, name: data.name, brand: data.brand, category: data.category },
    null
  );

  const result = db
    .prepare(
      `INSERT INTO hardware (slug, name, brand, category, price_eur, price_note, description, specs, images, buy_links, approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .run(
      slug,
      data.name,
      data.brand,
      data.category,
      data.price_eur ?? null,
      data.price_note ?? null,
      data.description,
      JSON.stringify(data.specs ?? {}),
      JSON.stringify(images),
      JSON.stringify(data.buy_links ?? [])
    );

  // Inserimento riuscito: ora consumiamo la quota.
  rateLimit(key, SUBMIT_LIMIT, SUBMIT_WINDOW_MS);

  const created = parseHardware(
    db.prepare('SELECT * FROM hardware WHERE id = ?').get(result.lastInsertRowid)
  );
  return NextResponse.json(
    {
      ok: true,
      pending: true,
      slug: created.slug,
      message:
        'Grazie! Il PC è stato inviato e sarà visibile nel catalogo dopo una rapida verifica del team.',
    },
    { status: 201 }
  );
}
