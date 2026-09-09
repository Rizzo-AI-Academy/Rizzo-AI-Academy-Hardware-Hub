// Rate limiter in-memory a finestra fissa: max N richieste per chiave nella finestra.
// Per un deploy single-instance (VPS con pm2/docker) è sufficiente.

const buckets = new Map();

// Pulizia periodica delle chiavi scadute per non far crescere la mappa.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();

/**
 * @param {string} key chiave del bucket (es. `comment:${ip}:${hardwareId}`)
 * @param {number} limit numero massimo di richieste nella finestra
 * @param {number} windowMs durata finestra in ms
 * @param {{ increment?: boolean }} opts increment=false = solo controllo (peek),
 *   senza consumare quota: usare prima della validazione e chiamare di nuovo con
 *   increment=true solo quando l'operazione va a buon fine.
 * @returns {{ allowed: boolean, retryAfterSec: number }}
 */
export function rateLimit(key, limit, windowMs, { increment = true } = {}) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (!increment) return { allowed: true, retryAfterSec: 0 };
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  if (increment) {
    bucket.count += 1;
    if (bucket.count > limit) {
      return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
    }
    return { allowed: true, retryAfterSec: 0 };
  }
  // Peek: bloccato quando la quota è già piena (count == limit significa che il
  // prossimo inserimento supererebbe il limite).
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}
