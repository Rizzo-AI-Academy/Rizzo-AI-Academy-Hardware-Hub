import { NextResponse } from 'next/server';

// Middleware globale: TRAPPOLA anti-bot.
// I path-esca tipici degli scanner (/.env, /.git, /wp-admin, …) vengono riscritti
// su /api/trap, che logga IP/UA/header/body e restituisce risposte-esca.
// Il sito è pubblico: l'autenticazione resta solo per l'admin (cookie/Bearer).

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

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (TRAP_PREFIXES.some((p) => pathname.toLowerCase().startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/trap';
    url.search = `?path=${encodeURIComponent(pathname)}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Tutto tranne gli asset interni di Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
