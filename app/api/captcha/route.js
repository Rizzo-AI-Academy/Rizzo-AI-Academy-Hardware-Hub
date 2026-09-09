import { NextResponse } from 'next/server';
import { issueCaptcha } from '@/lib/captcha';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Emette una challenge captcha "Non sono un robot".
// Rate limit generoso anti-farming: 20 challenge/min per IP.
export async function GET(request) {
  const ip = clientIp(request);
  const { allowed } = rateLimit(`captcha:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste, riprova tra poco.' }, { status: 429 });
  }
  return NextResponse.json({ token: issueCaptcha() });
}
