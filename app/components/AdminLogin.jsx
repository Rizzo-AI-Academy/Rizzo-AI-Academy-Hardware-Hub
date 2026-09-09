'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Accesso negato.');
        return;
      }
      router.refresh();
    } catch {
      setError('Errore di rete, riprova.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="comment-form admin-login" onSubmit={onSubmit}>
      <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Area riservata</h1>
      <p className="form-note">
        Inserisci il token amministratore (quello configurato come ADMIN_TOKEN sul server).
      </p>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Token amministratore"
        required
        autoFocus
        aria-label="Token amministratore"
        style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          color: 'var(--text)',
          padding: '10px 14px',
          fontSize: '0.95rem',
        }}
      />
      <button className="btn" type="submit" disabled={sending}>
        {sending ? 'Verifica…' : 'Accedi'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
