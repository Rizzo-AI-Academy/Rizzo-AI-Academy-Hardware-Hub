'use client';

import { useState } from 'react';
import Captcha from './Captcha';

const CATEGORIES = ['Apple', 'Mini PC', 'Mini PC Windows', 'Workstation', 'Schede sviluppo'];

const SPECS = [
  ['cpu', 'CPU'],
  ['ram', 'RAM'],
  ['gpu_npu', 'GPU / NPU'],
  ['tops_ai', 'TOPS AI'],
  ['storage', 'Storage'],
  ['power_w', 'Consumo (W)'],
  ['os', 'Sistema operativo'],
];

const initialForm = {
  name: '',
  brand: '',
  category: '',
  price_eur: '',
  price_note: '',
  description: '',
  link_label: '',
  link_url: '',
  specs: {},
};

export default function AddHardwareForm() {
  const [form, setForm] = useState(initialForm);
  const [website, setWebsite] = useState(''); // honeypot
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [sending, setSending] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSpec = (key) => (e) =>
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: e.target.value } }));

  async function onSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        name: form.name,
        brand: form.brand,
        category: form.category,
        price_eur: form.price_eur === '' ? null : Number(form.price_eur),
        price_note: form.price_note,
        description: form.description,
        specs: form.specs,
        buy_links:
          form.link_label && form.link_url
            ? [{ label: form.link_label, url: form.link_url }]
            : [],
        website, // honeypot
        captcha: captchaToken,
      };
      const res = await fetch('/api/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Errore durante l’invio.' });
        setCaptchaReset((n) => n + 1); // nuova challenge dopo un rifiuto
        return;
      }
      setForm(initialForm);
      setStatus({ type: 'success', message: data.message || 'Prodotto inviato, grazie!' });
      setCaptchaReset((n) => n + 1);
    } catch {
      setStatus({ type: 'error', message: 'Errore di rete, riprova.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="comment-form add-form" onSubmit={onSubmit}>
      <div className="add-form-grid">
        <label className="field">
          <span>Nome modello *</span>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Es. Minisforum UM790 Pro"
            maxLength={120}
            required
          />
        </label>
        <label className="field">
          <span>Brand *</span>
          <input
            type="text"
            value={form.brand}
            onChange={set('brand')}
            placeholder="Es. Minisforum"
            maxLength={60}
            required
          />
        </label>
        <label className="field">
          <span>Categoria *</span>
          <select value={form.category} onChange={set('category')} required>
            <option value="" disabled>
              Scegli…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Prezzo indicativo (€, facoltativo)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price_eur}
            onChange={set('price_eur')}
            placeholder="Lascia vuoto se non verificabile"
          />
        </label>
      </div>

      <label className="field">
        <span>Nota sul prezzo (facoltativa)</span>
        <input
          type="text"
          value={form.price_note}
          onChange={set('price_note')}
          placeholder="Es. prezzo Amazon UE, settembre 2026"
          maxLength={300}
        />
      </label>

      <label className="field">
        <span>Descrizione * — a cosa è adatto per l’AI, punti forti/deboli</span>
        <textarea
          value={form.description}
          onChange={set('description')}
          placeholder="Es. Mini PC con Ryzen 9 7940HS: ottimo per LLM piccoli con Ollama, RAM espandibile fino a 64GB…"
          maxLength={5000}
          required
        />
      </label>

      <fieldset className="admin-specs">
        <legend>Specifiche (facoltative ma consigliate)</legend>
        <div className="add-form-grid">
          {SPECS.map(([key, label]) => (
            <label className="field" key={key}>
              <span>{label}</span>
              <input
                type="text"
                value={form.specs[key] || ''}
                onChange={setSpec(key)}
                maxLength={300}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="add-form-grid">
        <label className="field">
          <span>Dove comprarlo — nome negozio (facoltativo)</span>
          <input
            type="text"
            value={form.link_label}
            onChange={set('link_label')}
            placeholder="Es. Amazon, sito ufficiale…"
            maxLength={60}
          />
        </label>
        <label className="field">
          <span>Link (https://…)</span>
          <input
            type="url"
            value={form.link_url}
            onChange={set('link_url')}
            placeholder="https://…"
            maxLength={500}
          />
        </label>
      </div>

      {/* Honeypot anti-bot: invisibile agli utenti reali */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hp-field"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="form-row">
        <Captcha
          onToken={setCaptchaToken}
          onCheckedChange={setCaptchaChecked}
          resetKey={captchaReset}
        />
        <button className="btn" type="submit" disabled={sending || !captchaChecked}>
          {sending ? 'Invio…' : 'Invia al catalogo'}
        </button>
      </div>

      <p className="form-note">
        Anti-spam: il prodotto sarà pubblicato dopo una rapida verifica del team. Niente
        pubblicità o link affiliati, grazie!
      </p>

      {status.message && (
        <p className={status.type === 'error' ? 'form-error' : 'form-success'}>{status.message}</p>
      )}
    </form>
  );
}
