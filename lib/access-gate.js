import crypto from 'node:crypto';

// Access gate "solo iscritti Academy": chiave condivisa (SITE_ACCESS_KEY) → cookie firmato.
// Il valore del cookie è un digest della chiave: non rivela la chiave e non si può forgiare.

const COOKIE_NAME = 'hh_access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni

export function accessKey() {
  return process.env.SITE_ACCESS_KEY || '';
}

export function gateEnabled() {
  return accessKey().length > 0;
}

export function accessCookieValue(key = accessKey()) {
  return crypto.createHash('sha256').update(`${key}::academy-gate`).digest('hex');
}

export function verifyAccessCookie(value) {
  if (!gateEnabled() || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(accessCookieValue());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyAccessKey(key) {
  if (!gateEnabled() || typeof key !== 'string') return false;
  const a = Buffer.from(key);
  const b = Buffer.from(accessKey());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function accessCookieString() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${accessCookieValue()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}
