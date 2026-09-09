import crypto from 'node:crypto';
import { getDb } from '@/lib/db';

// CAPTCHA self-hosted "Non sono un robot":
// challenge firmata HMAC + tempo minimo di permanenza umano + uso singolo (nonce in DB).
// Nessuna dipendenza esterna, nessuna chiave da registrare.

const SECRET = () => process.env.ADMIN_TOKEN || 'captcha-fallback-secret';
const MAX_AGE_MS = 10 * 60_000; // la challenge scade dopo 10 minuti
const MIN_DWELL_MS = 1_500; // un umano impiega almeno ~1.5s tra caricamento e invio

function sign(payload) {
  return crypto.createHmac('sha256', SECRET()).update(payload).digest('hex');
}

/** Emette una nuova challenge. Restituisce il token da mostrare (e rimandare) al client. */
export function issueCaptcha() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const iat = Date.now();
  const db = getDb();
  db.prepare(
    `INSERT INTO captcha_challenges (nonce, created_at) VALUES (?, datetime('now'))`
  ).run(nonce);
  // Pulizia opportunistica delle challenge vecchie
  db.prepare(`DELETE FROM captcha_challenges WHERE created_at < datetime('now', '-1 hour')`).run();
  const payload = `${nonce}.${iat}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verifica un token captcha: firma valida, non scaduto, tempo umano minimo, mai usato.
 * @returns {{ ok: boolean, error?: string }}
 */
export function verifyCaptcha(token) {
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    return { ok: false, error: 'Verifica "Non sono un robot" mancante: ricarica la pagina e riprova.' };
  }
  const [nonce, iatStr, signature] = token.split('.');
  const payload = `${nonce}.${iatStr}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'Verifica anti-bot non valida.' };
  }
  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || Date.now() - iat > MAX_AGE_MS) {
    return { ok: false, error: 'Verifica anti-bot scaduta: ricarica la pagina e riprova.' };
  }
  if (Date.now() - iat < MIN_DWELL_MS) {
    return { ok: false, error: 'Invio troppo veloce per essere umano.' };
  }
  const db = getDb();
  // Uso singolo: segna come usata solo se esisteva e non era già usata
  const result = db
    .prepare(`UPDATE captcha_challenges SET used = 1 WHERE nonce = ? AND used = 0`)
    .run(nonce);
  if (result.changes === 0) {
    return { ok: false, error: 'Verifica anti-bot già utilizzata o sconosciuta: ricarica la pagina.' };
  }
  return { ok: true };
}
