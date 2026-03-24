import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getNextExercise, submitAnswer, getUserStats } from '../api'
import SeoHead from '../components/SeoHead'
import AdSlot from '../components/AdSlot'

const CATEGORY_LABELS = {
  artikel: 'Artikel',
  wortschatz: 'Wortschatz',
  grammatik: 'Grammatik'
}

// Einfacher CSS-Spinner als SVG
function Spinner() {
  return (
    <svg
      className="animate-spin"
      style={{ width: 20, height: 20, display: 'inline-block', verticalAlign: 'middle' }}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function Exercise() {
  const { category } = useParams()

  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)   // ← neu: KI-Abfrage läuft
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [stats, setStats] = useState(null)
  const [answerAnim, setAnswerAnim] = useState('')
  const [exerciseCount, setExerciseCount] = useState(0)

  const loadExercise = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    setResult(null)
    setSubmitting(false)
    setAnswerAnim('')
    try {
      const ex = await getNextExercise(category || null)
      setExercise(ex)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    loadExercise()
    getUserStats().then(setStats).catch(() => {})
  }, [loadExercise])

  const handleAnswer = async (option) => {
    if (selected || submitting || !exercise) return

    // Sofort die Auswahl markieren, aber noch KEIN Rot/Grün zeigen
    setSelected(option)
    setSubmitting(true)   // Ladezustand aktivieren

    try {
      const res = await submitAnswer(exercise.exercise_id, option)
      setResult(res)
      setExerciseCount(c => c + 1)
      setAnswerAnim(res.is_correct ? 'animate-pop' : 'animate-shake')
      getUserStats().then(setStats).catch(() => {})
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)  // Ladezustand beenden
    }
  }

  const handleNext = () => {
    loadExercise()
  }

  const catLabel = CATEGORY_LABELS[category] || 'Alle Themen'
  const pageTitle = category
    ? `${catLabel} üben – Artikeltrainer.de`
    : 'Deutsch üben – Artikeltrainer.de'

  const schema = exercise ? {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": exercise.question,
    "educationalLevel": "beginner",
    "inLanguage": "de",
    "provider": { "@type": "Organization", "name": "Artikeltrainer.de" }
  } : null

  return (
    <>
      <SeoHead
        title={pageTitle}
        description={`Übe ${catLabel} auf Deutsch – adaptive Aufgaben, die sich deinem Niveau anpassen. Kostenlos und ohne Anmeldung.`}
        schema={schema}
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 pt-4 pb-2 text-sm text-slate-500 flex-wrap">
          <Link to="/" className="hover:text-green-600">Start</Link>
          <span>›</span>
          <Link to="/ueben" className="hover:text-green-600">Üben</Link>
          {category && (
            <>
              <span>›</span>
              <span className="text-slate-700 font-medium">{catLabel}</span>
            </>
          )}
        </nav>

        {/* Kategorie-Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { slug: null, label: '🌐 Alle' },
            { slug: 'artikel', label: '🎯 Artikel' },
            { slug: 'wortschatz', label: '📖 Wortschatz' },
            { slug: 'grammatik', label: '✏️ Grammatik' },
          ].map(tab => (
            <Link
              key={tab.slug ?? 'alle'}
              to={tab.slug ? `/ueben/${tab.slug}` : '/ueben'}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (category ?? null) === tab.slug
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Ad – direkt unter den Tabs, immer im sichtbaren Bereich */}
        <AdSlot slot="1122334455" format="horizontal" className="mb-4" />

        {/* Übungskarte */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
            <div className="h-6 bg-slate-100 rounded w-3/4 mb-6" />
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
            </div>
          </div>
        ) : exercise ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">

            {/* Kategorie-Badge */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {exercise.category.icon} {exercise.category.name}
              </span>
            </div>

            {/* Frage */}
            <div className="px-5 py-5">
              <p className="text-lg sm:text-xl font-semibold text-slate-800 leading-snug">
                {exercise.question}
              </p>
            </div>

            {/* Antwort-Buttons */}
            <div className={`px-5 pb-5 grid gap-3 ${exercise.options.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {exercise.options.map(option => {
                let btnStyle

                if (!selected) {
                  // Noch keine Auswahl – alle neutral
                  btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-green-400 hover:bg-green-50'
                } else if (submitting) {
                  // KI-Abfrage läuft: gewählter Button neutral-grau mit Spinner-Indikator,
                  // alle anderen ausgeblendet
                  if (option === selected) {
                    btnStyle = 'bg-slate-100 border-slate-300 text-slate-500'
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-40'
                  }
                } else {
                  // Ergebnis liegt vor: Rot/Grün anzeigen
                  if (option === result?.correct_answer) {
                    btnStyle = 'bg-green-500 border-green-500 text-white'
                  } else if (option === selected && !result?.is_correct) {
                    btnStyle = 'bg-red-500 border-red-500 text-white'
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={!!selected}
                    className={`
                      border-2 rounded-xl py-3 px-2 font-bold text-base sm:text-lg
                      transition-all active:scale-95 disabled:cursor-default
                      ${btnStyle}
                      ${!submitting && selected === option ? answerAnim : ''}
                    `}
                  >
                    {/* Spinner im gewählten Button während KI-Abfrage */}
                    {submitting && option === selected ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        <span>{option}</span>
                      </span>
                    ) : option}
                  </button>
                )
              })}
            </div>

            {/* KI-Hinweis während der Auswertung */}
            {submitting && (
              <div className="mx-5 mb-5 rounded-xl p-3 bg-slate-50 border border-slate-200 flex items-center gap-3 animate-fadeIn">
                <Spinner />
                <p className="text-sm text-slate-500">
                  KI wertet deine Antwort aus und erstellt ein Feedback …
                </p>
              </div>
            )}

            {/* Feedback – erscheint erst wenn KI-Ergebnis vorliegt */}
            {result && !submitting && (
              <div className={`mx-5 mb-5 rounded-xl p-4 animate-slideUp ${
                result.is_correct
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">
                    {result.is_correct ? '✅' : '❌'}
                  </span>
                  <div>
                    <p className={`font-semibold text-sm ${result.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                      {result.feedback}
                    </p>
                    {result.example && (
                      <p className="text-slate-500 text-sm mt-1 italic">
                        {result.example}
                      </p>
                    )}
                  </div>
                </div>

                {/* Skill-Anzeige */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Dein Niveau: <strong className="text-slate-600">{Math.round(result.skill_level)}</strong></span>
                  <span className={result.skill_change >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                    {result.skill_change >= 0 ? '+' : ''}{result.skill_change} Punkte
                  </span>
                </div>

                <button
                  onClick={handleNext}
                  className="mt-3 w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Nächste Aufgabe →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            Keine Aufgaben gefunden.
          </div>
        )}

        {/* Skill-Fortschrittsbalken */}
        {stats && (
          <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 animate-fadeIn">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Einsteiger</span>
              <span className="font-semibold text-green-600">{stats.level_label}</span>
              <span>Experte</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((stats.skill_level - 400) / 1600) * 100)}%` }}
              />
            </div>
          </div>
        )}

      </main>
    </>
  )
}
