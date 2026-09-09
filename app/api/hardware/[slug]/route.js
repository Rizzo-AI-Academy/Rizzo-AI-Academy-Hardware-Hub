import { NextResponse } from 'next/server';
import { getHardwareBySlug, listComments } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { slug } = await params;
  const hardware = getHardwareBySlug(slug);
  if (!hardware) {
    return NextResponse.json({ error: 'Hardware non trovato' }, { status: 404 });
  }
  return NextResponse.json({ hardware, comments: listComments(hardware.id) });
}
