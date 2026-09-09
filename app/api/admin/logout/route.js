import { NextResponse } from 'next/server';
import { clearSessionCookieString } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearSessionCookieString());
  return res;
}
