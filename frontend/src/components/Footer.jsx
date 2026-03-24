import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Artikeltrainer.de · Kostenlos Deutsch lernen
          </p>
          <nav className="flex gap-4 text-xs">
            <Link to="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
            <a
              href="https://www.artikeltrainer.de"
              className="hover:text-white transition-colors"
              target="_blank"
              rel="noopener"
            >
              Klassische Version
            </a>
          </nav>
        </div>
        <p className="text-xs text-slate-600 text-center mt-3">
          Kein Konto erforderlich · Keine personenbezogenen Daten · Datenschutz by Design
        </p>
      </div>
    </footer>
  )
}
