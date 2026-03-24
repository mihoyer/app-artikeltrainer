import SeoHead from '../components/SeoHead'

export function Impressum() {
  return (
    <>
      <SeoHead title="Impressum – Artikeltrainer.de" description="Impressum von Artikeltrainer.de" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Impressum</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-600 text-sm leading-relaxed">
          <p className="text-slate-400 italic">
            Bitte trage hier deine Angaben gemäß § 5 TMG ein.
          </p>
        </div>
      </main>
    </>
  )
}

export function Datenschutz() {
  return (
    <>
      <SeoHead title="Datenschutz – Artikeltrainer.de" description="Datenschutzerklärung von Artikeltrainer.de" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Datenschutzerklärung</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-600 text-sm leading-relaxed space-y-4">
          <section>
            <h2 className="font-bold text-slate-800 mb-1">Keine personenbezogenen Daten</h2>
            <p>
              Artikeltrainer.de erfordert keine Registrierung und speichert keine personenbezogenen Daten
              wie Name, E-Mail-Adresse oder Passwort. Dein Lernfortschritt wird ausschließlich über einen
              anonymen, zufällig generierten Token identifiziert, der in deinem Browser gespeichert wird.
            </p>
          </section>
          <section>
            <h2 className="font-bold text-slate-800 mb-1">Cookies und lokaler Speicher</h2>
            <p>
              Wir verwenden einen technisch notwendigen Cookie bzw. localStorage-Eintrag, um deinen
              anonymen Lernfortschritt sitzungsübergreifend zu speichern. Dieser enthält keinerlei
              personenbezogene Informationen.
            </p>
          </section>
          <section>
            <h2 className="font-bold text-slate-800 mb-1">Werbung (Google AdSense)</h2>
            <p>
              Diese Website nutzt Google AdSense zur Einblendung von Werbung. Google kann dabei Cookies
              setzen und Nutzungsdaten erheben. Weitere Informationen findest du in der
              <a href="https://policies.google.com/privacy" className="text-green-600 hover:underline ml-1" target="_blank" rel="noopener">
                Datenschutzerklärung von Google
              </a>.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
