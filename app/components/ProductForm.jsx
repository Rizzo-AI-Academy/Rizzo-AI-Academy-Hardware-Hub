'use client';

import { useState } from 'react';

const SPEC_FIELDS = [
  ['cpu', 'CPU'],
  ['ram', 'RAM'],
  ['gpu_npu', 'GPU / NPU'],
  ['tops_ai', 'TOPS AI'],
  ['storage', 'Storage'],
  ['power_w', 'Consumo'],
  ['os', 'Sistema operativo'],
];

const empty = {
  name: '',
  slug: '',
  brand: '',
  category: '',
  price_eur: '',
  price_note: '',
  description: '',
  image_url: '',
  specs: {},
  buyLinksText: '',
};

function toForm(hw) {
  return {
    name: hw.name || '',
    slug: hw.slug || '',
    brand: hw.brand || '',
    category: hw.category || '',
    price_eur: hw.price_eur ?? '',
    price_note: hw.price_note || '',
    description: hw.description || '',
    image_url: '',
    specs: hw.specs || {},
    buyLinksText: (hw.buy_links || []).map((l) => `${l.label} | ${l.url}`).join('\n'),
  };
}

function parseBuyLinks(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split('|');
      return { label: label.trim(), url: rest.join('|').trim() };
    })
    .filter((l) => l.label && l.url);
}

export default function ProductForm({ categories, initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial ? toForm(initial) : empty);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [sending, setSending] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSpec = (key, value) =>
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: value } }));

  async function onSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus({ type: '', message: '' });
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      brand: form.brand,
      category: form.category,
      price_eur: form.price_eur === '' ? null : Number(form.price_eur),
      price_note: form.price_note,
      description: form.description,
      specs: form.specs,
      buy_links: parseBuyLinks(form.buyLinksText),
    };
    if (form.image_url) payload.image_url = form.image_url;

    const url = initial ? `/api/admin/hardware/${initial.id}` : '/api/admin/hardware';
    const method = initial ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Errore durante il salvataggio.' });
        return;
      }
      setStatus({
        type: 'success',
        message: initial ? 'Prodotto aggiornato.' : `Prodotto creato: /hardware/${data.hardware.slug}`,
      });
      if (!initial) setForm(empty);
      onSaved();
    } catch {
      setStatus({ type: 'error', message: 'Errore di rete, riprova.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="comment-form admin-form" onSubmit={onSubmit}>
      <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
        {initial ? `Modifica: ${initial.name}` : 'Nuovo prodotto'}
      </h2>
      <div className="admin-grid">
        <label>
          Nome *
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} />
        </label>
        <label>
          Slug (vuoto = automatico dal nome)
          <input type="text" value={form.slug} onChange={(e) => set('slug', e.target.value)} maxLength={80} placeholder="es. mac-mini-m5" />
        </label>
        <label>
          Brand
          <input type="text" value={form.brand} onChange={(e) => set('brand', e.target.value)} maxLength={60} placeholder="es. Apple" />
        </label>
        <label>
          Categoria *
          <input
            type="text"
            list="admin-categories"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            required
            maxLength={60}
            placeholder="es. Mini PC Windows"
          />
          <datalist id="admin-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Prezzo indicativo (€, vuoto = da verificare)
          <input type="number" min="0" step="0.01" value={form.price_eur} onChange={(e) => set('price_eur', e.target.value)} placeholder="es. 729" />
        </label>
        <label>
          Nota sul prezzo
          <input type="text" value={form.price_note} onChange={(e) => set('price_note', e.target.value)} maxLength={300} placeholder="es. Listino Apple Italia, ottobre 2024" />
        </label>
      </div>

      <label>
        Descrizione
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={5000} />
      </label>

      <fieldset className="admin-specs">
        <legend>Specifiche</legend>
        <div className="admin-grid">
          {SPEC_FIELDS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input type="text" value={form.specs[key] || ''} onChange={(e) => setSpec(key, e.target.value)} maxLength={300} />
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        Link "Dove comprarlo" — uno per riga, formato: <code>Etichetta | URL</code>
        <textarea
          value={form.buyLinksText}
          onChange={(e) => set('buyLinksText', e.target.value)}
          placeholder={'Apple Store | https://www.apple.com/it/shop/buy-mac/mac-mini'}
          style={{ minHeight: 70 }}
        />
      </label>

      <label>
        Immagine da URL ufficiale (vuoto = placeholder automatico{initial ? ' / lascia invariata' : ''})
        <input type="url" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />
      </label>

      <div className="form-row">
        <span className="form-note">* campi obbligatori</span>
        <span style={{ display: 'flex', gap: 10 }}>
          {onCancel && (
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              Annulla
            </button>
          )}
          <button className="btn" type="submit" disabled={sending}>
            {sending ? 'Salvataggio…' : initial ? 'Salva modifiche' : 'Crea prodotto'}
          </button>
        </span>
      </div>
      {status.message && (
        <p className={status.type === 'error' ? 'form-error' : 'form-success'}>{status.message}</p>
      )}
    </form>
  );
}
