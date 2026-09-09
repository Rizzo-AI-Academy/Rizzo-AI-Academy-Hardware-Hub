import { NextResponse } from 'next/server';
import { getDb, getHardwareBySlug, listComments } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp, hashIp, sanitizeRating, sanitizeText } from '@/lib/security';
import { verifyCaptcha } from '@/lib/captcha';

export const dynamic = 'force-dynamic';

// Anti-abuso senza login: max 2 commenti ogni 30 secondi per IP per singolo hardware.
const RATE_LIMIT = 2;
const RATE_WINDOW_MS = 30_000;

export async function POST(request, { params }) {
  const { slug } = await params;
  const hardware = getHardwareBySlug(slug);
  if (!hardware) {
    return NextResponse.json({ error: 'Hardware non trovato' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  // Honeypot: campo nascosto che gli utenti reali non compilano mai.
  // Ai bot rispondiamo "ok" ma scartiamo silenziosamente il commento.
  if (body.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // CAPTCHA "Non sono un robot": obbligatorio per i commenti pubblici.
  const captcha = verifyCaptcha(body.captcha_token);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const ip = clientIp(request);
  const { allowed, retryAfterSec } = rateLimit(`comment:${ip}:${hardware.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: `Stai commentando troppo in fretta: riprova tra ${retryAfterSec} secondi.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    );
  }

  const authorName = sanitizeText(body.author_name, 60);
  const text = sanitizeText(body.text, 2000);
  const rating = sanitizeRating(body.rating);

  if (!authorName) {
    return NextResponse.json({ error: 'Inserisci il tuo nome.' }, { status: 400 });
  }
  if (text.length < 3) {
    return NextResponse.json({ error: 'Il commento è troppo corto (minimo 3 caratteri).' }, { status: 400 });
  }
  if (body.rating != null && body.rating !== '' && rating === null) {
    return NextResponse.json({ error: 'Il voto deve essere tra 1 e 5 stelle.' }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO comments (hardware_id, author_name, text, rating, ip_hash)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(hardware.id, authorName, text, rating, hashIp(ip));

  const comment = db
    .prepare('SELECT id, author_name, text, rating, created_at FROM comments WHERE id = ?')
    .get(result.lastInsertRowid);

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}

export async function GET(_request, { params }) {
  const { slug } = await params;
  const hardware = getHardwareBySlug(slug);
  if (!hardware) {
    return NextResponse.json({ error: 'Hardware non trovato' }, { status: 404 });
  }
  return NextResponse.json({ comments: listComments(hardware.id) });
}
