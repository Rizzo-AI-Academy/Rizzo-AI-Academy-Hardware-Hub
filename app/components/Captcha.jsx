'use client';

import { useCallback, useEffect, useState } from 'react';

// Widget captcha self-hosted stile "Non sono un robot":
// la challenge viene emessa dal server all'apertura del form e validata all'invio
// (firma HMAC + tempo minimo umano + uso singolo). Nessun servizio esterno.
export default function Captcha({ onToken, onCheckedChange, resetKey }) {
  const [state, setState] = useState('loading'); // loading | ready | checked | error

  const loadChallenge = useCallback(async () => {
    setState('loading');
    onCheckedChange?.(false);
    try {
      const res = await fetch('/api/captcha');
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error();
      onToken(data.token);
      setState('ready');
    } catch {
      onToken(null);
      setState('error');
    }
  }, [onToken, onCheckedChange]);

  // Carica una nuova challenge al mount e dopo ogni invio (resetKey cambia)
  useEffect(() => {
    loadChallenge();
  }, [loadChallenge, resetKey]);

  return (
    <div className="captcha-box" role="group" aria-label="Verifica anti-bot">
      <label className="captcha-label">
        <input
          type="checkbox"
          checked={state === 'checked'}
          disabled={state !== 'ready'}
          onChange={(e) => {
            if (!e.target.checked) return;
            setState('checked');
            onCheckedChange?.(true);
          }}
        />
        <span>Non sono un robot</span>
      </label>
      <span className="captcha-mark" aria-hidden="true">
        🛡️
        <small>
          {state === 'loading' && 'verifica…'}
          {state === 'ready' && 'anti-bot'}
          {state === 'checked' && '✓ verificato'}
          {state === 'error' && (
            <button type="button" className="captcha-retry" onClick={loadChallenge}>
              riprova
            </button>
          )}
        </small>
      </span>
    </div>
  );
}
