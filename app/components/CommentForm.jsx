'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CommentForm({ slug }) {
  const router = useRouter();
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState({ type: '', message: '' });
  const [sending, setSending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await fetch(`/api/hardware/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: author,
          text,
          rating: rating || null,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Errore durante l’invio.' });
        return;
      }
      setText('');
      setRating(0);
      setStatus({ type: 'success', message: 'Commento pubblicato. Grazie!' });
      router.refresh();
    } catch {
      setStatus({ type: 'error', message: 'Errore di rete, riprova.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={onSubmit}>
      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Il tuo nome"
        maxLength={60}
        required
        aria-label="Nome"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Lascia un commento — racconta la tua esperienza con questo hardware"
        maxLength={2000}
        required
        aria-label="Commento"
      />
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
        <div>
          <div className="stars-input" role="radiogroup" aria-label="Voto da 1 a 5 stelle">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className={i <= rating ? 'on' : ''}
                onClick={() => setRating(i === rating ? 0 : i)}
                aria-label={`${i} stelle`}
              >
                ★
              </button>
            ))}
          </div>
          <span className="form-note">Voto facoltativo · I commenti si possono solo aggiungere</span>
        </div>
        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Invio…' : 'Pubblica commento'}
        </button>
      </div>
      {status.message && (
        <p className={status.type === 'error' ? 'form-error' : 'form-success'}>{status.message}</p>
      )}
    </form>
  );
}
