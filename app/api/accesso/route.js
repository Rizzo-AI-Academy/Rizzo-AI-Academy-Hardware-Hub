import { NextResponse } from 'next/server';
import { accessCookieString, gateEnabled, verifyAccessKey } from '@/lib/access-gate';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Scambia la chiave Academy (SITE_ACCESS_KEY) con il cookie di accesso.
// Rate limit anti brute-force: 5 tentativi/min per IP.
export async function POST(request) {
  if (!gateEnabled()) {
    return NextResponse.json({ ok: true }); // cancello disattivato
  }
  const ip = clientIp(request);
  const { allowed } = rateLimit(`access:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Troppi tentativi, riprova tra un minuto.' }, { status: 429 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }
  if (!verifyAccessKey(body.key)) {
    return NextResponse.json({ error: 'Chiave non valida. Chiedi al team Academy.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', accessCookieString());
  return res;
}
