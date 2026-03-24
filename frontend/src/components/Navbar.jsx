import { Link } from 'react-router-dom'

// Deutsche Flagge als inline SVG – keine externe Abhängigkeit, immer sichtbar
function GermanFlag({ size = 32 }) {
  const h = Math.round(size * 0.6)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 5 3"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, borderRadius: 2 }}
      aria-label="Deutschland"
    >
      <rect width="5" height="1" y="0" fill="#000000" />
      <rect width="5" height="1" y="1" fill="#DD0000" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  )
}

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo – Flagge und Text immer sichtbar */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-green-600"
        >
          <GermanFlag size={36} />
          <span className="text-lg font-bold text-green-600">
            Artikeltrainer.de
          </span>
        </Link>

        {/* Üben-Button */}
        <Link
          to="/ueben"
          className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
        >
          Üben
        </Link>

      </div>
    </header>
  )
}
