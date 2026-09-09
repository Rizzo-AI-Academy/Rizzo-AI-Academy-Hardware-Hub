import AddHardwareForm from '@/app/components/AddHardwareForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Aggiungi un PC — Rizzo AI Academy Hardware Hub',
  description: 'Suggerisci un hardware per AI al catalogo della community.',
  robots: { index: false, follow: false },
};

export default function AggiungiPage() {
  return (
    <section className="aggiungi-wrap">
      <h1 className="aggiungi-title">Aggiungi un PC al catalogo</h1>
      <p className="aggiungi-lead">
        Conosci un mini PC, un Mac, una workstation o una scheda di sviluppo adatta all’AI locale
        che manca nel catalogo? Segnalala alla community! Dopo una rapida verifica del team
        apparirà tra le schede pubbliche.
      </p>
      <AddHardwareForm />
    </section>
  );
}
