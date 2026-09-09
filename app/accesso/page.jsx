import AccessForm from '@/app/components/AccessForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Accesso — Rizzo AI Academy Hardware Hub',
  robots: { index: false, follow: false },
};

export default function AccessoPage() {
  return (
    <div className="accesso-wrap">
      <div className="accesso-card">
        <div className="accesso-logo">
          <img src="/brand/logo.png" alt="Rizzo AI Academy" />
        </div>
        <span className="accesso-badge">🔒 Area riservata agli iscritti</span>
        <h1>Hardware Hub</h1>
        <p className="lead">
          Il catalogo community-driven di hardware per AI è un benefit riservato agli iscritti
          della <strong>Rizzo AI Academy</strong>. Per accedere devi essere iscritto
          all&apos;Academy e avere la chiave d&apos;accesso.
        </p>
        <AccessForm />
        <p className="accesso-help">
          Sei iscritto ma non trovi la chiave? La trovi nei canali riservati dell&apos;Academy
          (community e lezioni live) oppure scrivi a{' '}
          <a href="mailto:info@rizzoaiacademy.com">info@rizzoaiacademy.com</a>.
        </p>
        <div className="accesso-divider">Non sei ancora iscritto?</div>
        <div className="accesso-cta">
          <p>
            Entra nella community: corsi pratici, lezioni live ogni settimana e accesso
            all&apos;Hardware Hub.
          </p>
          <a
            className="btn"
            href="https://www.rizzoaiacademy.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Scopri la Rizzo AI Academy →
          </a>
        </div>
      </div>
    </div>
  );
}
