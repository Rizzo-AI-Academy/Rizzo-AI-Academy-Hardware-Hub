import { listHardware } from '@/lib/db';
import Catalog from '@/app/components/Catalog';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const hardware = listHardware();
  return (
    <>
      <section className="hero">
        <h1>Hardware per AI, scelto dalla community</h1>
        <p>
          Mini PC, Mac, workstation e schede di sviluppo per far girare modelli AI in locale.
          Schede illustrate, specifiche e commenti aperti: chiunque può contribuire, nessuno può
          cancellare.
        </p>
      </section>
      <Catalog hardware={hardware} />
    </>
  );
}
