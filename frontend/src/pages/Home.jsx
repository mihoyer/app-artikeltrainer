import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getUserStats } from '../api'
import SeoHead from '../components/SeoHead'
import AdSlot from '../components/AdSlot'

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Artikeltrainer.de",
  "url": "https://neu.artikeltrainer.de",
  "description": "Lerne Deutsch interaktiv mit adaptiven Übungen zu Artikeln, Grammatik und Wortschatz.",
  "inLanguage": "de"
}

export default function Home() {
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCategories(), getUserStats()])
      .then(([cats, s]) => {
        setCategories(cats)
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <SeoHead
        title="Artikeltrainer.de – Deutsch lernen mit adaptiven Übungen"
        description="Lerne Deutsch kostenlos und ohne Anmeldung. Adaptive Übungen zu Artikeln (der, die, das), Grammatik und Wortschatz – die Plattform passt sich deinem Niveau an."
        canonical="https://neu.artikeltrainer.de/"
        schema={SCHEMA}
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-8">

        {/* Hero */}
        <section className="text-center pt-8 pb-6 animate-fadeIn">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
            Lerne Deutsch –<br className="sm:hidden" /> wann du willst
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-md mx-auto">
            Adaptive Übungen zu Artikeln, Grammatik und Wortschatz.
            Die Plattform erkennt dein Niveau und passt sich automatisch an.
          </p>
          <Link
            to="/ueben"
            className="inline-block mt-5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold px-8 py-3 rounded-xl text-lg shadow-md transition-all"
          >
            Jetzt üben →
          </Link>
        </section>

        {/* Ad – Top Banner */}
        <AdSlot slot="1234567890" format="horizontal" />

        {/* Statistik-Karte (wenn vorhanden) */}
        {stats && stats.total_exercises > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 animate-slideUp">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Dein Fortschritt
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.total_exercises}</div>
                <div className="text-xs text-slate-500 mt-0.5">Übungen</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">{stats.accuracy}%</div>
                <div className="text-xs text-slate-500 mt-0.5">Trefferquote</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{stats.streak} 🔥</div>
                <div className="text-xs text-slate-500 mt-0.5">Streak</div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="inline-block bg-green-50 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                Niveau: {stats.level_label}
              </span>
            </div>
          </section>
        )}

        {/* Kategorien */}
        <section className="animate-slideUp">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Themen wählen</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categories.map(cat => (
                <Link
                  key={cat.slug}
                  to={`/ueben/${cat.slug}`}
                  className="card-hover bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center shadow-sm"
                >
                  <span className="text-4xl mb-2">{cat.icon}</span>
                  <h3 className="font-bold text-slate-800 text-base">{cat.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{cat.description}</p>
                  <span className="mt-2 text-xs text-green-600 font-medium">
                    {cat.exercise_count} Übungen
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slideUp">
          {[
            { icon: '🎯', title: 'Adaptiv', text: 'Das System erkennt dein Niveau und passt die Schwierigkeit automatisch an.' },
            { icon: '💡', title: 'Sofort-Feedback', text: 'Nach jeder Aufgabe bekommst du eine kurze Erklärung – warum richtig oder falsch.' },
            { icon: '🔒', title: 'Ohne Anmeldung', text: 'Kein Konto, keine E-Mail. Dein Fortschritt wird anonym gespeichert.' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.text}</p>
            </div>
          ))}
        </section>

        {/* Ad – Bottom */}
        <AdSlot slot="0987654321" format="auto" className="mt-6" />

      </main>
    </>
  )
}
