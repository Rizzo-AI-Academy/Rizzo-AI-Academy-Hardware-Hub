import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin, passesOriginCheck } from '@/lib/admin-auth';

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

/**
 * Moderazione admin.
 *   GET    /api/admin/comments  → lista completa (inclusi nascosti)
 *   PATCH  /api/admin/comments  → { id, hidden } nasconde/mostra
 *   DELETE /api/admin/comments  → { id } elimina definitivamente
 *
 * Auth: Bearer <ADMIN_TOKEN> oppure cookie di sessione della dashboard.
 */
export async function GET(request) {
  const denied = guard(request);
  if (denied) return denied;
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
  const denied = guard(request, true);
  if (denied) return denied;
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

export async function DELETE(request) {
  const denied = guard(request, true);
  if (denied) return denied;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'ID commento non valido' }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: 'Commento non trovato' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id });
}
