'use client';

import { useMemo, useState } from 'react';
import HardwareCard from './HardwareCard';

export default function Catalog({ hardware }) {
  const categories = useMemo(
    () => [...new Set(hardware.map((h) => h.category))].sort(),
    [hardware]
  );
  const [category, setCategory] = useState('Tutte');
  const [query, setQuery] = useState('');

  const filtered = hardware.filter((h) => {
    const matchCategory = category === 'Tutte' || h.category === category;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q || h.name.toLowerCase().includes(q) || h.brand.toLowerCase().includes(q);
    return matchCategory && matchQuery;
  });

  return (
    <>
      <div className="filters">
        {['Tutte', ...categories].map((c) => (
          <button
            key={c}
            className={`filter-btn ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        className="search-input"
        type="text"
        placeholder="Cerca per nome o brand…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Cerca hardware"
      />
      {filtered.length === 0 ? (
        <div className="empty-state">Nessun hardware trovato con questi filtri.</div>
      ) : (
        <div className="grid">
          {filtered.map((hw) => (
            <HardwareCard key={hw.id} hw={hw} />
          ))}
        </div>
      )}
    </>
  );
}
