'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from './ProductForm';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('prodotti');
  const [hardware, setHardware] = useState([]);
  const [comments, setComments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const [hw, cm] = await Promise.all([
      fetch('/api/admin/hardware').then((r) => r.json()),
      fetch('/api/admin/comments').then((r) => r.json()),
    ]);
    setHardware(hw.hardware || []);
    setComments(cm.comments || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = [...new Set(hardware.map((h) => h.category))].sort();

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
          ['commenti', `Commenti (${comments.length})`],
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
          {showNew || editing ? (
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
          ) : (
            <button className="btn" onClick={() => setShowNew(true)}>
              + Nuovo prodotto
            </button>
          )}

          <div className="admin-list">
            {hardware.map((hw) => (
              <div key={hw.id} className="admin-row">
                <img src={hw.images?.[0]} alt="" className="admin-thumb" />
                <div className="admin-row-main">
                  <strong>{hw.name}</strong>
                  <span className="form-note">
                    {hw.category} · {hw.brand} · {hw.comments_total} commenti
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
        <div className="admin-list">
          {comments.length === 0 && <div className="empty-state">Nessun commento.</div>}
          {comments.map((c) => (
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
      )}
    </div>
  );
}
