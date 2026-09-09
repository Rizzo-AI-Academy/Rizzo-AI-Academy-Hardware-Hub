export default function Stars({ value, count, showCount = true }) {
  const rating = Math.round((value || 0) * 2) / 2;
  return (
    <span className="stars" title={value ? `Media ${Number(value).toFixed(1)}/5` : 'Nessun voto'}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? '' : 'off'}>
          ★
        </span>
      ))}
      {showCount && (
        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginLeft: 6 }}>
          {value ? Number(value).toFixed(1) : '—'} ({count || 0})
        </span>
      )}
    </span>
  );
}
