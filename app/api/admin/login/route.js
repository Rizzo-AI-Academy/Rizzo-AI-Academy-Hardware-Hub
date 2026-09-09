import { NextResponse } from 'next/server';
import { sessionCookieString, verifyToken } from '@/lib/admin-auth';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Login admin: scambia l'ADMIN_TOKEN con un cookie di sessione firmato.
// Rate limit stretto contro il brute force: 5 tentativi/min per IP.
export async function POST(request) {
  const ip = clientIp(request);
  const { allowed } = rateLimit(`admin-login:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Troppi tentativi, riprova tra un minuto.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  if (!verifyToken(body.token)) {
    return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', sessionCookieString());
  return res;
}
