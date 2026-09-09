import { NextResponse } from 'next/server';
import { logTrapHit } from '@/lib/trap';

export const dynamic = 'force-dynamic';

// Risposte-esca plausibili per tipo di path: il bot crede di aver trovato qualcosa,
// noi intanto abbiamo loggato IP, user agent e fingerprint completo.
function decoyResponse(path) {
  if (path.includes('.env')) {
    return new NextResponse(
      [
        '# ATTENZIONE: file di configurazione',
        'APP_ENV=production',
        'ADMIN_TOKEN=9f4c2dec0y7f41a3b8e5d6c7a2b1f0e9d8c7b6a5948372f1e0d9c8b7a65f4e3d2c1',
        'DATABASE_PATH=/srv/app/data/prod.db',
        'BACKUP_FTP=ftp://backup:Pr0dBackup2024!@10.0.4.21/srv/backups',
      ].join('\n'),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
  if (path.includes('.git')) {
    return new NextResponse(
      '[core]\n\trepositoryformatversion = 0\n\tbare = false\n[remote "origin"]\n\turl = git@github.com:hardware-hub/prod-internal.git\n',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
  if (path.includes('wp-') || path.includes('xmlrpc')) {
    return new NextResponse(
      '<html><head><title>WordPress &rsaquo; Login</title></head><body><form method="post"><input name="log"/><input name="pwd" type="password"/></form></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
  return NextResponse.json({
    debug: true,
    env: 'production',
    version: '0.9.3-internal',
    note: 'internal debug endpoint - DO NOT EXPOSE',
  });
}

async function handle(request) {
  const url = new URL(request.url);
  const originalPath = url.searchParams.get('path') || url.pathname;
  let body = '';
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text().catch(() => '');
  }
  await logTrapHit(request, originalPath, body);
  return decoyResponse(originalPath);
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
