import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '64px 0', textAlign: 'center' }}>
      <h1>Hardware non trovato</h1>
      <p style={{ color: 'var(--text-dim)' }}>
        La scheda che cerchi non esiste (o non è ancora nel catalogo).
      </p>
      <Link className="btn" href="/">
        Torna al catalogo
      </Link>
    </div>
  );
}
