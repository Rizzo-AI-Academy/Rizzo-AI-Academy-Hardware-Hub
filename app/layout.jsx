import './globals.css';

export const metadata = {
  title: 'Rizzo AI Academy — Hardware Hub',
  description:
    'Catalogo community-driven di hardware per AI: mini PC, Mac, workstation e schede di sviluppo, con commenti aperti della community italiana.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <a href="/" className="logo">
              {/* Logo ufficiale Rizzo AI Academy */}
              <img src="/brand/logo.png" alt="Rizzo AI Academy" />
              <span className="logo-sub">Hardware Hub</span>
            </a>
            <nav>
              <a href="/">Catalogo</a>
              <a href="/aggiungi" className="btn btn-nav">
                + Aggiungi un PC
              </a>
              <a href="https://www.rizzoaiacademy.com/" target="_blank" rel="noopener noreferrer">
                rizzoaiacademy.com ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>
              <a href="https://www.rizzoaiacademy.com/" target="_blank" rel="noopener noreferrer">
                Rizzo AI Academy
              </a>{' '}
              — Hardware Hub · Catalogo community-driven di hardware per AI. Chiunque può
              aggiungere un PC o un commento: i contenuti si possono solo aggiungere, nessuno può
              cancellare quelli degli altri.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
