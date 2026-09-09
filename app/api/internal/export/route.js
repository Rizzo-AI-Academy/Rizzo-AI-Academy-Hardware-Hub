import { NextResponse } from 'next/server';
import { logTrapHit } from '@/lib/trap';

export const dynamic = 'force-dynamic';

// ⚠️ QUESTO ENDPOINT È UNA TRAPPOLA (documentato nel README, sezione sicurezza).
// Sembra un export di debug dimenticato esposto per errore: non richiede auth e
// promette "tutti i dati". Bot e agenti malevoli lo proveranno: noi logghiamo
// IP, user agent, header e parametri, e rispondiamo con dati-esca innocui.
async function handle(request) {
  const url = new URL(request.url);
  let body = '';
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text().catch(() => '');
  }
  await logTrapHit(
    request,
    `/api/internal/export${url.search}`,
    body || `params: ${url.search}`
  );
  return NextResponse.json({
    status: 'ok',
    export_id: 'exp_2024_11_05_0031',
    rows: 14823,
    download: '/api/internal/export/download?token=exp_2024_11_05_0031',
    note: 'snapshot cache — internal use only',
  });
}

export { handle as GET, handle as POST };
