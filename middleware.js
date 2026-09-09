import { NextResponse } from 'next/server';

// TRAPPOLA anti-bot: i path tipici di scanner/bot (`.env`, `.git`, `wp-admin`, ecc.)
// non esistono in questa app Next.js — chi li cerca è quasi certamente automatizzato.
// Il middleware li riscrive all'endpoint /api/trap che LOGGA tutto (IP, UA, header, body)
// e risponde con contenuti-esca plausibili.

const TRAP_PREFIXES = [
  '/.env',
  '/.git',
  '/.aws',
  '/.svn',
  '/wp-admin',
  '/wp-login',
  '/wordpress',
  '/xmlrpc.php',
  '/phpmyadmin',
  '/config.php',
  '/server-status',
  '/actuator',
  '/debug',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hit = TRAP_PREFIXES.some((p) => pathname.toLowerCase().startsWith(p));
  if (!hit) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = '/api/trap';
  url.search = `?path=${encodeURIComponent(pathname)}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/.env',
    '/.git/:path*',
    '/.aws/:path*',
    '/.svn/:path*',
    '/wp-admin/:path*',
    '/wp-login.php',
    '/wordpress/:path*',
    '/xmlrpc.php',
    '/phpmyadmin/:path*',
    '/config.php',
    '/server-status',
    '/actuator/:path*',
    '/debug/:path*',
  ],
};
