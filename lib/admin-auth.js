import crypto from 'node:crypto';

const COOKIE_NAME = 'hh_admin';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 giorni

function adminToken() {
  return process.env.ADMIN_TOKEN || '';
}

function sign(payload) {
  return crypto.createHmac('sha256', adminToken()).update(payload).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Verifica il token in chiaro (login / Bearer). */
export function verifyToken(token) {
  const expected = adminToken();
  return !!expected && !!token && safeEqual(token, expected);
}

/** Crea il valore del cookie di sessione admin (HMAC firmato, senza segreti dentro). */
export function makeSessionCookie() {
  const payload = 'admin';
  return `${payload}.${sign(payload)}`;
}

export function verifySessionCookie(value) {
  if (!value || !value.includes('.')) return false;
  const [payload, signature] = value.split('.');
  return payload === 'admin' && safeEqual(signature, sign(payload));
}

export function sessionCookieString() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${makeSessionCookie()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function clearSessionCookieString() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function cookieFromRequest(request) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE_NAME) return v.join('=');
  }
  return null;
}

/**
 * Autorizzazione admin: accetta Bearer ADMIN_TOKEN (per agenti/script)
 * oppure il cookie di sessione firmato (per la dashboard web).
 */
export function isAdmin(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ') && verifyToken(auth.slice(7))) return true;
  return verifySessionCookie(cookieFromRequest(request));
}

/**
 * Protezione CSRF per le mutazioni autenticate via cookie:
 * se la richiesta usa il cookie (nessun Bearer), l'Origin deve coincidere con l'host.
 */
export function passesOriginCheck(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return true; // server-to-server: niente CSRF
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
}
