import { sanitizeText } from '@/lib/security';

export const SPEC_KEYS = ['cpu', 'ram', 'gpu_npu', 'tops_ai', 'storage', 'power_w', 'os'];

/**
 * Valida e normalizza il payload di un prodotto (create/update).
 * @returns {{ data?: object, error?: string }}
 */
export function validateProductPayload(body, { partial = false } = {}) {
  const data = {};

  if (!partial || body.name !== undefined) {
    data.name = sanitizeText(body.name, 120);
    if (!data.name) return { error: 'Il nome è obbligatorio.' };
  }
  if (!partial || body.brand !== undefined) {
    data.brand = sanitizeText(body.brand, 60) || 'Generico';
  }
  if (!partial || body.category !== undefined) {
    data.category = sanitizeText(body.category, 60);
    if (!data.category) return { error: 'La categoria è obbligatoria.' };
  }
  if (body.price_eur !== undefined) {
    if (body.price_eur === null || body.price_eur === '') {
      data.price_eur = null;
    } else {
      const n = Number(body.price_eur);
      if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
        return { error: 'Prezzo non valido (lascia vuoto se non verificabile).' };
      }
      data.price_eur = Math.round(n * 100) / 100;
    }
  }
  if (body.price_note !== undefined) data.price_note = sanitizeText(body.price_note, 300);
  if (body.description !== undefined) data.description = sanitizeText(body.description, 5000);

  if (body.specs !== undefined) {
    const specs = {};
    for (const key of SPEC_KEYS) {
      const v = sanitizeText(body.specs?.[key], 300);
      if (v) specs[key] = v;
    }
    data.specs = specs;
  }

  if (body.buy_links !== undefined) {
    const links = [];
    for (const l of Array.isArray(body.buy_links) ? body.buy_links : []) {
      const label = sanitizeText(l?.label, 60);
      let url = '';
      try {
        const u = new URL(String(l?.url || ''));
        if (u.protocol === 'http:' || u.protocol === 'https:') url = u.toString();
      } catch {
        /* URL non valido: saltato */
      }
      if (label && url) links.push({ label, url });
    }
    data.buy_links = links.slice(0, 5);
  }

  return { data };
}
