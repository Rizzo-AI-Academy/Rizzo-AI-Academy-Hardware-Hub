import { NextResponse } from 'next/server';

// Middleware globale:
// 1) TRAPPOLA anti-bot: path-esca tipici degli scanner → log + risposte-esca
// 2) ACCESS GATE: se SITE_ACCESS_KEY è impostata, il sito è riservato agli iscritti
//    Academy (cookie hh_access). Le API admin restano libere (hanno il Bearer token).

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

// Path esenti dal cancello: pagina di accesso, admin API (hanno il Bearer), trappola, asset pubblici
const GATE_EXEMPT = ['/accesso', '/api/accesso', '/api/admin', '/api/trap', '/hardware-images', '/brand', '/fonts', '/icon.svg', '/robots.txt'];

async function accessDigest(key) {
  const data = new TextEncoder().encode(`${key}::academy-gate`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1) Trappola: sempre attiva, anche davanti al cancello (gli scanner arrivano comunque)
  if (TRAP_PREFIXES.some((p) => pathname.toLowerCase().startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/trap';
    url.search = `?path=${encodeURIComponent(pathname)}`;
    return NextResponse.rewrite(url);
  }

  // 2) Access gate
  const key = process.env.SITE_ACCESS_KEY;
  if (!key) return NextResponse.next(); // cancello disattivato (sviluppo)
  if (GATE_EXEMPT.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = request.cookies.get('hh_access')?.value;
  if (cookie && cookie === (await accessDigest(key))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Accesso riservato agli iscritti Academy.' }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/accesso';
  url.search = pathname !== '/' ? `?from=${encodeURIComponent(pathname)}` : '';
  return NextResponse.redirect(url);
}

export const config = {
  // Tutto tranne gli asset interni di Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
