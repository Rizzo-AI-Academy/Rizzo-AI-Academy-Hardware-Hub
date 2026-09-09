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
 * Log della trappola anti-bot.
 *   GET    /api/admin/trap-logs           → ultimi 200 accessi sospetti (più recenti prima)
 *   GET    /api/admin/trap-logs?ip=1.2.3.4 → filtra per IP
 *   DELETE /api/admin/trap-logs           → { id? } elimina un log o (senza id) svuota tutto
 */
export async function GET(request) {
  const denied = guard(request);
  if (denied) return denied;
  const ip = new URL(request.url).searchParams.get('ip');
  const db = getDb();
  const rows = ip
    ? db.prepare('SELECT * FROM trap_logs WHERE ip = ? ORDER BY datetime(created_at) DESC LIMIT 500').all(ip)
    : db.prepare('SELECT * FROM trap_logs ORDER BY datetime(created_at) DESC LIMIT 200').all();
  const total = db.prepare('SELECT COUNT(*) AS n FROM trap_logs').get().n;
  return NextResponse.json({ total, logs: rows });
}

export async function DELETE(request) {
  const denied = guard(request, true);
  if (denied) return denied;
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* body vuoto = svuota tutto */
  }
  const db = getDb();
  if (body.id) {
    const result = db.prepare('DELETE FROM trap_logs WHERE id = ?').run(Number(body.id));
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Log non trovato' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: 1 });
  }
  const result = db.prepare('DELETE FROM trap_logs').run();
  return NextResponse.json({ ok: true, deleted: result.changes });
}
