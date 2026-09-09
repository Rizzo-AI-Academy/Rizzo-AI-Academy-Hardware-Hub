import Stars from './Stars';

export function formatPrice(hw) {
  if (hw.price_eur != null) {
    return (
      <span className="price">
        €{Number(hw.price_eur).toLocaleString('it-IT', { maximumFractionDigits: 0 })}
      </span>
    );
  }
  return <span className="price tba">{hw.price_note || 'Prezzo da verificare'}</span>;
}

export default function HardwareCard({ hw }) {
  const img = hw.images?.[0] || '/hardware-images/placeholder.svg';
  return (
    <a href={`/hardware/${hw.slug}`} className="card">
      <img className="card-img" src={img} alt={hw.name} loading="lazy" />
      <div className="card-body">
        <span className="card-category">{hw.category}</span>
        <h3 className="card-title">{hw.name}</h3>
        <span className="card-brand">{hw.brand}</span>
        <div className="card-meta">
          {formatPrice(hw)}
          <Stars value={hw.avg_rating} count={hw.comments_count} />
        </div>
      </div>
    </a>
  );
}
