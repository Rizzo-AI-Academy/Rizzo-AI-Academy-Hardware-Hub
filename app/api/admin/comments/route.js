import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const auth = request.headers.get('authorization') || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Moderazione admin (unica via per nascondere/mostrare commenti).
 *
 *   GET   /api/admin/comments            → lista completa (inclusi nascosti)
 *   PATCH /api/admin/comments            → { id, hidden } nasconde/mostra
 *
 * Header obbligatorio: Authorization: Bearer <ADMIN_TOKEN>
 */
export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  const db = getDb();
  const comments = db
    .prepare(
      `SELECT c.id, c.hardware_id, h.name AS hardware_name, h.slug AS hardware_slug,
              c.author_name, c.text, c.rating, c.hidden, c.created_at
       FROM comments c JOIN hardware h ON h.id = c.hardware_id
       ORDER BY datetime(c.created_at) DESC`
    )
    .all();
  return NextResponse.json({ comments });
}

export async function PATCH(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }
  const id = Number(body.id);
  const hidden = body.hidden ? 1 : 0;
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'ID commento non valido' }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare('UPDATE comments SET hidden = ? WHERE id = ?').run(hidden, id);
  if (result.changes === 0) {
    return NextResponse.json({ error: 'Commento non trovato' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id, hidden });
}
