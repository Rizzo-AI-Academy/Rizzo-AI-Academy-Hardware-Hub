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
              <span className="logo-mark">◆</span> Rizzo AI Academy
              <span className="logo-sub">Hardware Hub</span>
            </a>
            <nav>
              <a href="/">Catalogo</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>
              Rizzo AI Academy — Hardware Hub · Catalogo community-driven di hardware per AI.
              I commenti si possono solo aggiungere: nessuno può cancellare quelli degli altri.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
