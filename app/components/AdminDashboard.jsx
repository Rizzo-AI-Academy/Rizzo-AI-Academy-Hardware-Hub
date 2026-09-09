'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from './ProductForm';

const SORTS = {
  prodotti: [
    ['categoria', 'Categoria'],
    ['nome', 'Nome A-Z'],
    ['prezzo-asc', 'Prezzo ↑'],
    ['prezzo-desc', 'Prezzo ↓'],
    ['commenti', 'N° commenti'],
  ],
  commenti: [
    ['recenti', 'Più recenti'],
    ['vecchi', 'Più vecchi'],
    ['voto-desc', 'Voto ↓'],
    ['voto-asc', 'Voto ↑'],
  ],
};

function priceValue(hw) {
  return hw.price_eur == null ? Number.POSITIVE_INFINITY : hw.price_eur;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('prodotti');
  const [hardware, setHardware] = useState([]);
  const [comments, setComments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [notice, setNotice] = useState('');

  // Filtri prodotti
  const [pQuery, setPQuery] = useState('');
  const [pCategory, setPCategory] = useState('Tutte');
  const [pSort, setPSort] = useState('categoria');

  // Filtri commenti
  const [cQuery, setCQuery] = useState('');
  const [cProduct, setCProduct] = useState('Tutti');
  const [cStatus, setCStatus] = useState('tutti'); // tutti | visibili | nascosti
  const [cSort, setCSort] = useState('recenti');

  // Log trappola anti-bot
  const [trapLogs, setTrapLogs] = useState([]);
  const [trapTotal, setTrapTotal] = useState(0);
  const [tQuery, setTQuery] = useState('');

  const load = useCallback(async () => {
    const [hw, cm, tl] = await Promise.all([
      fetch('/api/admin/hardware').then((r) => r.json()),
      fetch('/api/admin/comments').then((r) => r.json()),
      fetch('/api/admin/trap-logs').then((r) => r.json()),
    ]);
    setHardware(hw.hardware || []);
    setComments(cm.comments || []);
    setTrapLogs(tl.logs || []);
    setTrapTotal(tl.total || 0);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(hardware.map((h) => h.category))].sort(),
    [hardware]
  );

  const filteredProducts = useMemo(() => {
    const q = pQuery.trim().toLowerCase();
    const list = hardware.filter((h) => {
      const matchQuery =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.brand.toLowerCase().includes(q) ||
        (h.description || '').toLowerCase().includes(q);
      const matchCategory = pCategory === 'Tutte' || h.category === pCategory;
      return matchQuery && matchCategory;
    });
    const by = {
      categoria: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
      nome: (a, b) => a.name.localeCompare(b.name),
      'prezzo-asc': (a, b) => priceValue(a) - priceValue(b),
      'prezzo-desc': (a, b) => priceValue(b) - priceValue(a),
      commenti: (a, b) => b.comments_total - a.comments_total,
    };
    return [...list].sort(by[pSort]);
  }, [hardware, pQuery, pCategory, pSort]);

  const filteredComments = useMemo(() => {
    const q = cQuery.trim().toLowerCase();
    const list = comments.filter((c) => {
      const matchQuery =
        !q ||
        c.author_name.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        c.hardware_name.toLowerCase().includes(q);
      const matchProduct = cProduct === 'Tutti' || c.hardware_slug === cProduct;
      const matchStatus =
        cStatus === 'tutti' || (cStatus === 'visibili' ? !c.hidden : !!c.hidden);
      return matchQuery && matchProduct && matchStatus;
    });
    const by = {
      recenti: (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id,
      vecchi: (a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id,
      'voto-desc': (a, b) => (b.rating || 0) - (a.rating || 0),
      'voto-asc': (a, b) => (a.rating || 0) - (b.rating || 0),
    };
    return [...list].sort(by[cSort]);
  }, [comments, cQuery, cProduct, cStatus, cSort]);

  const hiddenCount = comments.filter((c) => c.hidden).length;

  const filteredTraps = useMemo(() => {
    const q = tQuery.trim().toLowerCase();
    if (!q) return trapLogs;
    return trapLogs.filter(
      (l) =>
        l.ip.includes(q) ||
        l.path.toLowerCase().includes(q) ||
        l.user_agent.toLowerCase().includes(q)
    );
  }, [trapLogs, tQuery]);

  async function clearTrapLogs() {
    if (!confirm(`Eliminare tutti i ${trapTotal} log della trappola?`)) return;
    const res = await fetch('/api/admin/trap-logs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (res.ok) {
      setNotice('Log trappola svuotati.');
      load();
    }
  }

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice(`Errore: ${data.error || res.status}`);
      return false;
    }
    return true;
  }

  async function deleteHardware(hw) {
    if (!confirm(`Eliminare "${hw.name}"? Verranno eliminati anche i suoi ${hw.comments_total} commenti. Operazione irreversibile.`)) return;
    if (await api('DELETE', `/api/admin/hardware/${hw.id}`)) {
      setNotice(`Prodotto "${hw.name}" eliminato.`);
      setEditing(null);
      load();
    }
  }

  async function toggleComment(c) {
    if (await api('PATCH', '/api/admin/comments', { id: c.id, hidden: !c.hidden })) {
      setNotice(c.hidden ? 'Commento reso visibile.' : 'Commento nascosto.');
      load();
    }
  }

  async function deleteComment(c) {
    if (!confirm(`Eliminare definitivamente il commento di "${c.author_name}"?`)) return;
    if (await api('DELETE', '/api/admin/comments', { id: c.id })) {
      setNotice('Commento eliminato.');
      load();
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="admin">
      <div className="admin-head">
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Dashboard admin</h1>
        <button className="btn btn-outline" onClick={logout}>
          Esci
        </button>
      </div>

      <div className="filters">
        {[
          ['prodotti', `Prodotti (${hardware.length})`],
          ['commenti', `Commenti (${comments.length}${hiddenCount ? `, ${hiddenCount} nascosti` : ''})`],
          ['trappola', `Trappola 🪤 (${trapTotal})`],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn ${tab === key ? 'active' : ''}`}
            onClick={() => {
              setTab(key);
              setEditing(null);
              setShowNew(false);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && <p className="form-success">{notice}</p>}

      {tab === 'prodotti' && (
        <>
          <div className="admin-toolbar">
            <input
              type="text"
              placeholder="Cerca per nome, brand o descrizione…"
              value={pQuery}
              onChange={(e) => setPQuery(e.target.value)}
              aria-label="Cerca prodotti"
            />
            <select value={pCategory} onChange={(e) => setPCategory(e.target.value)} aria-label="Filtra per categoria">
              <option value="Tutte">Tutte le categorie</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={pSort} onChange={(e) => setPSort(e.target.value)} aria-label="Ordina prodotti">
              {SORTS.prodotti.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            {!showNew && !editing && (
              <button className="btn" onClick={() => setShowNew(true)}>
                + Nuovo prodotto
              </button>
            )}
          </div>

          {(showNew || editing) && (
            <ProductForm
              categories={categories}
              initial={editing}
              onSaved={() => {
                setEditing(null);
                setShowNew(false);
                load();
              }}
              onCancel={() => {
                setEditing(null);
                setShowNew(false);
              }}
            />
          )}

          <p className="form-note" style={{ marginTop: 14 }}>
            {filteredProducts.length} di {hardware.length} prodotti
          </p>
          <div className="admin-list" style={{ marginTop: 8 }}>
            {filteredProducts.length === 0 && (
              <div className="empty-state">Nessun prodotto corrisponde ai filtri.</div>
            )}
            {filteredProducts.map((hw) => (
              <div key={hw.id} className="admin-row">
                <img src={hw.images?.[0]} alt="" className="admin-thumb" />
                <div className="admin-row-main">
                  <strong>{hw.name}</strong>
                  <span className="form-note">
                    {hw.category} · {hw.brand} ·{' '}
                    {hw.price_eur != null ? `€${Number(hw.price_eur).toLocaleString('it-IT')}` : 'prezzo da verificare'} ·{' '}
                    {hw.comments_total} commenti
                    {hw.comments_hidden > 0 && ` (${hw.comments_hidden} nascosti)`} ·{' '}
                    <a href={`/hardware/${hw.slug}`} target="_blank" rel="noopener noreferrer">
                      vedi scheda ↗
                    </a>
                  </span>
                </div>
                <div className="admin-row-actions">
                  <button className="btn btn-outline" onClick={() => { setEditing(hw); setShowNew(false); window.scrollTo(0, 0); }}>
                    Modifica
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteHardware(hw)}>
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'commenti' && (
        <>
          <div className="admin-toolbar">
            <input
              type="text"
              placeholder="Cerca per autore, testo o prodotto…"
              value={cQuery}
              onChange={(e) => setCQuery(e.target.value)}
              aria-label="Cerca commenti"
            />
            <select value={cProduct} onChange={(e) => setCProduct(e.target.value)} aria-label="Filtra per prodotto">
              <option value="Tutti">Tutti i prodotti</option>
              {hardware.map((h) => (
                <option key={h.slug} value={h.slug}>{h.name}</option>
              ))}
            </select>
            <select value={cStatus} onChange={(e) => setCStatus(e.target.value)} aria-label="Filtra per stato">
              <option value="tutti">Visibili + nascosti</option>
              <option value="visibili">Solo visibili</option>
              <option value="nascosti">Solo nascosti</option>
            </select>
            <select value={cSort} onChange={(e) => setCSort(e.target.value)} aria-label="Ordina commenti">
              {SORTS.commenti.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>

          <p className="form-note" style={{ marginTop: 14 }}>
            {filteredComments.length} di {comments.length} commenti
          </p>
          <div className="admin-list" style={{ marginTop: 8 }}>
            {filteredComments.length === 0 && (
              <div className="empty-state">Nessun commento corrisponde ai filtri.</div>
            )}
            {filteredComments.map((c) => (
              <div key={c.id} className={`admin-row ${c.hidden ? 'admin-row-hidden' : ''}`}>
                <div className="admin-row-main">
                  <strong>
                    {c.author_name}
                    {c.rating ? ` · ${'★'.repeat(c.rating)}` : ''}
                    {c.hidden ? ' · nascosto' : ''}
                  </strong>
                  <span className="form-note">
                    su <a href={`/hardware/${c.hardware_slug}`} target="_blank" rel="noopener noreferrer">{c.hardware_name}</a> ·{' '}
                    {new Date(`${c.created_at}Z`).toLocaleString('it-IT')}
                  </span>
                  <p className="admin-comment-text">{c.text}</p>
                </div>
                <div className="admin-row-actions">
                  <button className="btn btn-outline" onClick={() => toggleComment(c)}>
                    {c.hidden ? 'Mostra' : 'Nascondi'}
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteComment(c)}>
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'trappola' && (
        <>
          <div className="admin-toolbar">
            <input
              type="text"
              placeholder="Filtra per IP, path o user agent…"
              value={tQuery}
              onChange={(e) => setTQuery(e.target.value)}
              aria-label="Filtra log trappola"
            />
            {trapTotal > 0 && (
              <button className="btn btn-danger" onClick={clearTrapLogs}>
                Svuota log
              </button>
            )}
          </div>
          <p className="form-note" style={{ marginTop: 14 }}>
            Accessi sospetti intercettati dalla trappola (path-esca tipo <code>/.env</code>,{' '}
            <code>/.git</code>, <code>/wp-admin</code>, finto export di debug). Mostrati gli ultimi 200 di{' '}
            {trapTotal}.
          </p>
          <div className="admin-list" style={{ marginTop: 8 }}>
            {filteredTraps.length === 0 && (
              <div className="empty-state">
                Nessun accesso sospetto intercettato finora. Ottimo segno 🎉
              </div>
            )}
            {filteredTraps.map((l) => (
              <div key={l.id} className="admin-row">
                <div className="admin-row-main">
                  <strong>
                    {l.ip} <span className="badge">{l.method}</span> <code>{l.path}</code>
                  </strong>
                  <span className="form-note">
                    {new Date(`${l.created_at}Z`).toLocaleString('it-IT')} · {l.user_agent || 'user-agent assente'}
                  </span>
                  {l.body && <p className="admin-comment-text">{l.body}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
