/**
 * DeclensionExercise – Deklinations-Aufgabe mit Kasus-Tabelle und Satzbeispielen.
 *
 * Zeigt ein Nomen mit allen vier Kasus-Formen und Satzbeispielen.
 * Der Nutzer wählt die richtige Form für einen vorgegebenen Satz.
 *
 * Props:
 *   exercise   – Aufgaben-Objekt (exercise_type: "declension")
 *   onAnswer   – Callback(selectedForm)
 *   result     – Ergebnis-Objekt oder null
 *   submitting – Boolean
 *   onNext     – Callback für "Nächste Aufgabe"
 */

import { useState, useEffect } from 'react'

const KASUS_LABELS = {
  nominativ: 'Nominativ',
  akkusativ: 'Akkusativ',
  dativ: 'Dativ',
  genitiv: 'Genitiv'
}

const KASUS_FRAGE = {
  nominativ: 'Wer/Was?',
  akkusativ: 'Wen/Was?',
  dativ: 'Wem?',
  genitiv: 'Wessen?'
}

const GENDER_COLORS = {
  maskulin: 'bg-blue-100 text-blue-700 border-blue-300',
  feminin: 'bg-pink-100 text-pink-700 border-pink-300',
  neutrum: 'bg-purple-100 text-purple-700 border-purple-300'
}

export default function DeclensionExercise({ exercise, onAnswer, result, submitting, onNext }) {
  const [selected, setSelected] = useState(null)
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    setSelected(null)
    setShowTable(false)
  }, [exercise])

  const handleSelect = (option) => {
    if (selected || submitting || result) return
    setSelected(option)
    onAnswer(option)
  }

  const cases = exercise?.cases || {}
  const sentences = exercise?.sentences || []
  const targetKasus = exercise?.target_kasus || 'nominativ'
  const targetSentence = exercise?.target_sentence || ''
  const options = exercise?.options || []
  const correctAnswer = result?.correct_answer || cases[targetKasus] || ''
  const genderStyle = GENDER_COLORS[exercise?.gender] || 'bg-slate-100 text-slate-600 border-slate-300'

  return (
    <div className="px-5 pb-5">
      {/* Nomen + Genus-Badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-bold text-slate-800">{exercise?.noun}</span>
        {exercise?.gender && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${genderStyle}`}>
            {exercise.gender}
          </span>
        )}
      </div>

      {/* Ziel-Satz mit Lücke */}
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs font-semibold text-amber-700 mb-1">
          Welche Form passt in diesen Satz? ({KASUS_LABELS[targetKasus]} – {KASUS_FRAGE[targetKasus]})
        </p>
        <p className="text-base font-semibold text-slate-800">
          {targetSentence
            ? targetSentence.replace(cases[targetKasus] || '___', '___')
            : `Wähle die richtige ${KASUS_LABELS[targetKasus]}-Form:`
          }
        </p>
      </div>

      {/* Antwort-Optionen */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {options.map(option => {
          let btnStyle

          if (!selected && !result) {
            btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-green-400 hover:bg-green-50'
          } else if (submitting) {
            if (option === selected) {
              btnStyle = 'bg-slate-100 border-slate-300 text-slate-500'
            } else {
              btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-40'
            }
          } else if (result) {
            if (option === correctAnswer) {
              btnStyle = 'bg-green-500 border-green-500 text-white'
            } else if (option === selected && !result.is_correct) {
              btnStyle = 'bg-red-500 border-red-500 text-white'
            } else {
              btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }
          } else {
            btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
          }

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={!!selected || !!result}
              className={`
                border-2 rounded-xl py-3 px-3 font-bold text-sm sm:text-base
                transition-all active:scale-95 disabled:cursor-default text-left
                ${btnStyle}
              `}
            >
              {submitting && option === selected ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {option}
                </span>
              ) : option}
            </button>
          )
        })}
      </div>

      {/* Deklinationstabelle – aufklappbar */}
      <button
        onClick={() => setShowTable(t => !t)}
        className="w-full text-sm text-slate-500 hover:text-green-600 flex items-center justify-center gap-1 py-2 transition-colors"
      >
        <span>{showTable ? '▲' : '▼'}</span>
        {showTable ? 'Tabelle ausblenden' : 'Alle Formen anzeigen'}
      </button>

      {showTable && (
        <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 text-slate-500 font-semibold">Kasus</th>
                <th className="text-left px-3 py-2 text-slate-500 font-semibold">Frage</th>
                <th className="text-left px-3 py-2 text-slate-500 font-semibold">Form</th>
                <th className="text-left px-3 py-2 text-slate-500 font-semibold hidden sm:table-cell">Beispiel</th>
              </tr>
            </thead>
            <tbody>
              {['nominativ', 'akkusativ', 'dativ', 'genitiv'].map((kasus, i) => (
                <tr
                  key={kasus}
                  className={`border-b border-slate-100 last:border-0 ${kasus === targetKasus ? 'bg-amber-50' : ''}`}
                >
                  <td className="px-3 py-2 font-semibold text-slate-700">
                    {KASUS_LABELS[kasus]}
                    {kasus === targetKasus && <span className="ml-1 text-amber-500">←</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{KASUS_FRAGE[kasus]}</td>
                  <td className="px-3 py-2 font-bold text-slate-800">{cases[kasus] || '–'}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs hidden sm:table-cell">
                    {sentences[i] || '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Satzbeispiele nach Auswertung */}
      {result && sentences.length > 0 && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 mb-2 font-medium">Satzbeispiele:</p>
          <ul className="space-y-1">
            {sentences.map((s, i) => (
              <li key={i} className="text-sm text-slate-700">
                <span className="text-xs text-slate-400 mr-1">
                  {KASUS_LABELS[['nominativ','akkusativ','dativ','genitiv'][i]]}:
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
