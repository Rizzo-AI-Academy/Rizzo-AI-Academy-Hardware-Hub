import { getDb } from '@/lib/db';
import { clientIp } from '@/lib/security';

// Header sensibili da NON loggare (non ci interessa rubare sessioni: ci interessa identificare i bot)
const SKIP_HEADERS = new Set(['cookie', 'authorization', 'x-admin-token']);

/**
 * Registra un accesso sospetto nella tabella trap_logs.
 * Cattura: IP reale, metodo, path, user agent, tutti gli header (esclusi cookie/token),
 * e un estratto del body. Serve a identificare bot, scanner e agenti malevoli.
 */
export async function logTrapHit(request, path, bodySnippet = '') {
  try {
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      if (!SKIP_HEADERS.has(key.toLowerCase())) {
        headers[key] = value.slice(0, 300);
      }
    }
    const db = getDb();
    db.prepare(
      `INSERT INTO trap_logs (ip, method, path, user_agent, headers, body)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      clientIp(request),
      request.method,
      String(path).slice(0, 500),
      (request.headers.get('user-agent') || '').slice(0, 300),
      JSON.stringify(headers),
      String(bodySnippet).slice(0, 2000)
    );
  } catch {
    // La trappola non deve mai rompere la risposta
  }
}
