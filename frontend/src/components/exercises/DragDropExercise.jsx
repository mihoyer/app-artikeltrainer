/**
 * DragDropExercise – Wörter per Drag & Drop in die richtige Reihenfolge bringen.
 *
 * Props:
 *   exercise   – Aufgaben-Objekt vom Backend (exercise_type: "dragdrop")
 *   onAnswer   – Callback(userAnswerString) wenn der Nutzer abschickt
 *   result     – Ergebnis-Objekt vom Backend (oder null)
 *   submitting – Boolean: KI-Auswertung läuft
 *   onNext     – Callback für "Nächste Aufgabe"
 */

import { useState, useEffect } from 'react'

export default function DragDropExercise({ exercise, onAnswer, result, submitting, onNext }) {
  const [orderedWords, setOrderedWords] = useState([])
  const [dragIndex, setDragIndex] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (exercise?.words) {
      setOrderedWords([...exercise.words])
      setSubmitted(false)
    }
  }, [exercise])

  // Reset wenn neue Aufgabe geladen wird
  useEffect(() => {
    if (!result) {
      setSubmitted(false)
    }
  }, [result])

  const handleDragStart = (index) => {
    setDragIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const newOrder = [...orderedWords]
    const dragged = newOrder.splice(dragIndex, 1)[0]
    newOrder.splice(index, 0, dragged)
    setOrderedWords(newOrder)
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  // Touch-Support: einfaches Tap-to-Swap
  const [touchSelected, setTouchSelected] = useState(null)

  const handleTap = (index) => {
    if (submitted || result) return
    if (touchSelected === null) {
      setTouchSelected(index)
    } else {
      if (touchSelected !== index) {
        const newOrder = [...orderedWords]
        ;[newOrder[touchSelected], newOrder[index]] = [newOrder[index], newOrder[touchSelected]]
        setOrderedWords(newOrder)
      }
      setTouchSelected(null)
    }
  }

  const handleSubmit = () => {
    if (submitted || submitting || result) return
    setSubmitted(true)
    onAnswer(orderedWords.join(','))
  }

  const correctOrder = result?.correct_order || []
  const isWordCorrect = (word, index) => {
    if (!result) return null
    return correctOrder[index] === word
  }

  return (
    <div className="px-5 pb-5">
      {/* Wort-Chips */}
      <div className="flex flex-wrap gap-2 min-h-[56px] p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl mb-4">
        {orderedWords.map((word, index) => {
          const correct = isWordCorrect(word, index)
          let chipStyle = 'bg-white border-slate-300 text-slate-700 cursor-grab active:cursor-grabbing shadow-sm'

          if (result) {
            chipStyle = correct
              ? 'bg-green-100 border-green-400 text-green-800 cursor-default'
              : 'bg-red-100 border-red-400 text-red-800 cursor-default'
          } else if (touchSelected === index) {
            chipStyle = 'bg-green-100 border-green-400 text-green-800 cursor-pointer ring-2 ring-green-400'
          } else {
            chipStyle = 'bg-white border-slate-300 text-slate-700 cursor-pointer hover:border-green-400 hover:bg-green-50 shadow-sm'
          }

          return (
            <div
              key={`${word}-${index}`}
              draggable={!result}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleTap(index)}
              className={`
                px-3 py-2 rounded-lg border-2 font-medium text-sm sm:text-base
                transition-all select-none
                ${chipStyle}
                ${dragIndex === index && !result ? 'opacity-50 scale-95' : ''}
              `}
            >
              {word}
            </div>
          )
        })}
      </div>

      {/* Hinweis für Touch-Nutzer */}
      {!result && !submitting && (
        <p className="text-xs text-slate-400 mb-3 text-center">
          Tippe zwei Wörter an, um sie zu tauschen – oder ziehe sie per Drag & Drop.
        </p>
      )}

      {/* Abschicken-Button */}
      {!result && (
        <button
          onClick={handleSubmit}
          disabled={submitting || submitted}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-95"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Wird ausgewertet …
            </span>
          ) : 'Antwort prüfen ✓'}
        </button>
      )}

      {/* Ergebnis: richtige Reihenfolge anzeigen */}
      {result && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 mb-1 font-medium">Richtige Reihenfolge:</p>
          <p className="text-sm font-semibold text-slate-700">
            {correctOrder.join(' ')}
          </p>
        </div>
      )}
    </div>
  )
}
