import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/** GET /api/admin/stats — metriche riassuntive per dashboard e agenti. */
export async function GET(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  const db = getDb();
  const products = db.prepare('SELECT COUNT(*) AS n FROM hardware').get().n;
  const commentsTotal = db.prepare('SELECT COUNT(*) AS n FROM comments').get().n;
  const commentsHidden = db
    .prepare('SELECT COUNT(*) AS n FROM comments WHERE hidden = 1')
    .get().n;
  const perCategory = db
    .prepare('SELECT category, COUNT(*) AS n FROM hardware GROUP BY category ORDER BY category')
    .all();
  const latestComments = db
    .prepare(
      `SELECT c.id, c.author_name, c.rating, c.hidden, c.created_at, h.name AS hardware_name, h.slug AS hardware_slug
       FROM comments c JOIN hardware h ON h.id = c.hardware_id
       ORDER BY datetime(c.created_at) DESC LIMIT 5`
    )
    .all();
  const topRated = db
    .prepare(
      `SELECT h.name, h.slug, COUNT(c.id) AS voti, ROUND(AVG(c.rating), 1) AS media
       FROM hardware h JOIN comments c ON c.hardware_id = h.id AND c.hidden = 0 AND c.rating IS NOT NULL
       GROUP BY h.id ORDER BY media DESC, voti DESC LIMIT 5`
    )
    .all();
  return NextResponse.json({
    products,
    comments: { total: commentsTotal, hidden: commentsHidden, visible: commentsTotal - commentsHidden },
    per_category: perCategory,
    latest_comments: latestComments,
    top_rated: topRated,
  });
}
