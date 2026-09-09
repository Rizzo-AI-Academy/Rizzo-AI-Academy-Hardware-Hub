import { notFound } from 'next/navigation';
import { getHardwareBySlug, listComments, listHardware } from '@/lib/db';
import Stars from '@/app/components/Stars';
import Gallery from '@/app/components/Gallery';
import CommentForm from '@/app/components/CommentForm';
import { formatPrice } from '@/app/components/HardwareCard';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return listHardware().map((h) => ({ slug: h.slug }));
}

const SPEC_LABELS = {
  cpu: 'CPU',
  ram: 'RAM',
  gpu_npu: 'GPU / NPU',
  tops_ai: 'TOPS AI',
  storage: 'Storage',
  power_w: 'Consumo',
  os: 'Sistema operativo',
};

function formatDate(iso) {
  return new Date(`${iso}Z`).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function HardwarePage({ params }) {
  return <HardwareDetail params={params} />;
}

async function HardwareDetail({ params }) {
  const { slug } = await params;
  const hw = getHardwareBySlug(slug);
  if (!hw) notFound();
  const comments = listComments(hw.id);

  return (
    <>
      <div className="detail">
        <Gallery images={hw.images} name={hw.name} />
        <div>
          <h1>{hw.name}</h1>
          <p className="detail-sub">
            <span className="badge">{hw.category}</span>
            {hw.brand}
          </p>
          <Stars value={hw.avg_rating} count={hw.comments_count} />
          <table className="spec-table">
            <tbody>
              {Object.entries(SPEC_LABELS).map(([key, label]) =>
                hw.specs[key] ? (
                  <tr key={key}>
                    <th>{label}</th>
                    <td>{hw.specs[key]}</td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
          <p>
            <strong>Prezzo indicativo:</strong> {formatPrice(hw)}
          </p>
          {hw.buy_links.length > 0 && (
            <div className="buy-links">
              {hw.buy_links.map((l) => (
                <a
                  key={l.url}
                  className="btn btn-outline"
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  Dove comprarlo · {l.label} ↗
                </a>
              ))}
            </div>
          )}
          <p className="description">{hw.description}</p>
        </div>
      </div>

      <section className="comments-section">
        <h2>
          Commenti della community ({comments.length})
        </h2>
        <CommentForm slug={hw.slug} />
        {comments.length === 0 ? (
          <div className="empty-state">
            Nessun commento ancora. Se hai questo hardware, racconta la tua esperienza!
          </div>
        ) : (
          comments.map((c) => (
            <article key={c.id} className="comment">
              <div className="comment-head">
                <span>
                  <span className="comment-author">{c.author_name}</span>{' '}
                  {c.rating && <Stars value={c.rating} showCount={false} />}
                </span>
                <span className="comment-date">{formatDate(c.created_at)}</span>
              </div>
              <p className="comment-text">{c.text}</p>
            </article>
          ))
        )}
      </section>
    </>
  );
}
