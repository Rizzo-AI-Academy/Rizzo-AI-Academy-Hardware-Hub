import AccessForm from '@/app/components/AccessForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Accesso — Rizzo AI Academy Hardware Hub',
  robots: { index: false, follow: false },
};

export default function AccessoPage() {
  return (
    <div className="admin-login-wrap">
      <div className="comment-form admin-login">
        <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Area riservata agli iscritti</h1>
        <p className="form-note">
          L'Hardware Hub è riservato alla community di Rizzo AI Academy. Inserisci la chiave
          d'accesso che hai ricevuto nei canali Academy.
        </p>
        <AccessForm />
      </div>
    </div>
  );
}
