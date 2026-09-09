'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/accesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Accesso negato.');
        return;
      }
      const from = searchParams.get('from');
      router.push(from && from.startsWith('/') && !from.startsWith('//') ? from : '/');
      router.refresh();
    } catch {
      setError('Errore di rete, riprova.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Chiave d'accesso Academy"
        required
        autoFocus
        aria-label="Chiave d'accesso Academy"
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
        {sending ? 'Verifica…' : 'Entra'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
