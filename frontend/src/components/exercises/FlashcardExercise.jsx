/**
 * FlashcardExercise – Karteikarte mit Flip-Animation.
 *
 * Props:
 *   exercise   – Aufgaben-Objekt (exercise_type: "flashcard")
 *   onAnswer   – Callback("known" | "unknown")
 *   result     – Ergebnis-Objekt oder null
 *   submitting – Boolean
 *   onNext     – Callback für "Nächste Aufgabe"
 */

import { useState, useEffect } from 'react'

export default function FlashcardExercise({ exercise, onAnswer, result, submitting, onNext }) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    setFlipped(false)
    setAnswered(false)
  }, [exercise])

  const handleFlip = () => {
    if (!answered) setFlipped(f => !f)
  }

  const handleAnswer = (known) => {
    if (answered || submitting) return
    setAnswered(true)
    onAnswer(known ? 'known' : 'unknown')
  }

  return (
    <div className="px-5 pb-5">
      {/* Karteikarte */}
      <div
        onClick={handleFlip}
        className="relative w-full cursor-pointer select-none"
        style={{ perspective: '1000px', minHeight: '180px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '180px'
          }}
        >
          {/* Vorderseite */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">
              Vorderseite
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 text-center">
              {exercise?.front}
            </p>
            {!flipped && (
              <p className="text-xs text-slate-400 mt-4">Tippe um umzudrehen ↩</p>
            )}
          </div>

          {/* Rückseite */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
              Rückseite
            </span>
            <p className="text-base sm:text-lg font-semibold text-slate-800 text-center leading-snug">
              {exercise?.back}
            </p>
            {exercise?.example && (
              <p className="text-sm text-slate-500 italic mt-3 text-center">
                „{exercise.example}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Selbstbewertungs-Buttons – nur nach dem Umdrehen */}
      {flipped && !answered && !result && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAnswer(false)}
            disabled={submitting}
            className="py-3 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-all active:scale-95"
          >
            ✗ Noch nicht gewusst
          </button>
          <button
            onClick={() => handleAnswer(true)}
            disabled={submitting}
            className="py-3 rounded-xl border-2 border-green-400 bg-green-50 text-green-700 font-bold text-sm hover:bg-green-100 transition-all active:scale-95"
          >
            ✓ Gewusst!
          </button>
        </div>
      )}

      {/* Hinweis vor dem Umdrehen */}
      {!flipped && !answered && (
        <p className="text-center text-sm text-slate-500 mt-3">
          Kennst du dieses Wort? Drehe die Karte um und bewerte dich selbst.
        </p>
      )}

      {/* Hint */}
      {exercise?.hint && flipped && !answered && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-700">
            <span className="font-semibold">💡 Tipp: </span>{exercise.hint}
          </p>
        </div>
      )}
    </div>
  )
}
