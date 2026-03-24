/**
 * FillBlankExercise – Lückentext-Aufgabe.
 *
 * Zeigt einen Satz mit einer Lücke (___). Der Nutzer wählt aus vorgegebenen
 * Optionen die richtige Antwort aus (Multiple-Choice-Stil).
 *
 * Props:
 *   exercise   – Aufgaben-Objekt (exercise_type: "fillblank")
 *   onAnswer   – Callback(selectedOption)
 *   result     – Ergebnis-Objekt oder null
 *   submitting – Boolean
 *   onNext     – Callback für "Nächste Aufgabe"
 */

import { useState, useEffect } from 'react'

export default function FillBlankExercise({ exercise, onAnswer, result, submitting, onNext }) {
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setSelected(null)
  }, [exercise])

  const handleSelect = (option) => {
    if (selected || submitting || result) return
    setSelected(option)
    onAnswer(option)
  }

  // Satz mit Lücke rendern: ___ durch farbige Box ersetzen
  const renderSentence = (sentence, filledWith = null, isCorrect = null) => {
    if (!sentence) return null
    const parts = sentence.split('___')
    if (parts.length < 2) return <span>{sentence}</span>

    let gapStyle = 'inline-block min-w-[60px] px-2 py-0.5 rounded border-b-2 text-center font-bold'
    if (filledWith && isCorrect === true) {
      gapStyle += ' bg-green-100 border-green-500 text-green-800'
    } else if (filledWith && isCorrect === false) {
      gapStyle += ' bg-red-100 border-red-500 text-red-800'
    } else if (filledWith) {
      gapStyle += ' bg-slate-100 border-slate-400 text-slate-700'
    } else {
      gapStyle += ' bg-slate-100 border-slate-400 text-slate-400'
    }

    return (
      <>
        {parts[0]}
        <span className={gapStyle}>
          {filledWith || '___'}
        </span>
        {parts[1]}
      </>
    )
  }

  const correctAnswer = result?.correct_answer || ''

  return (
    <div className="px-5 pb-5">
      {/* Satz mit Lücke */}
      <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-lg sm:text-xl font-semibold text-slate-800 leading-relaxed">
          {result
            ? renderSentence(exercise?.sentence, selected, result.is_correct)
            : renderSentence(exercise?.sentence, selected)
          }
        </p>
      </div>

      {/* Antwort-Optionen */}
      <div className={`grid gap-3 ${(exercise?.options?.length || 0) <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {(exercise?.options || []).map(option => {
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
                border-2 rounded-xl py-3 px-2 font-bold text-base sm:text-lg
                transition-all active:scale-95 disabled:cursor-default
                ${btnStyle}
              `}
            >
              {submitting && option === selected ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
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

      {/* Vollständiger Satz nach Auswertung */}
      {result && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 mb-1 font-medium">Vollständiger Satz:</p>
          <p className="text-sm font-semibold text-slate-700">
            {exercise?.sentence?.replace('___', correctAnswer)}
          </p>
        </div>
      )}
    </div>
  )
}
