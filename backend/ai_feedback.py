"""
KI-gestütztes Feedback mit Caching.

Ablauf:
1. Nutzerantwort wird gehasht.
2. Prüfe ob Hash bereits in der Datenbank (Cache-Hit) → sofort zurückgeben.
3. Falls nicht → OpenAI API anfragen → Ergebnis speichern (Cache-Miss).

Unterstützte Übungstypen:
  - multichoice  : Einfacher String-Vergleich + KI-Feedback
  - dragdrop     : Reihenfolge-Vergleich (kommaseparierter String)
  - flashcard    : Selbstbewertung (immer "korrekt" aus Nutzersicht, kein Elo-Einfluss)
  - fillblank    : String-Vergleich (normalisiert) + KI-Feedback
  - declension   : Kasus-Auswahl-Vergleich + KI-Feedback
"""

import hashlib
import logging
import os
from sqlalchemy.orm import Session
from models import AIFeedbackCache, Exercise
from openai import OpenAI

logger = logging.getLogger(__name__)

# Lazy initialization – Client wird erst beim ersten Aufruf erstellt
_client = None

def _get_client():
    global _client
    if _client is None:
        key = os.getenv("OPENAI_API_KEY", "")
        _client = OpenAI(api_key=key)
    return _client

def _call_openai(prompt: str) -> str:
    """Ruft OpenAI auf – kompatibel mit v1.x und v2.x."""
    client = _get_client()
    import openai
    version = tuple(int(x) for x in openai.__version__.split('.')[:2])
    if version >= (2, 0):
        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
            max_output_tokens=120
        )
        return response.output_text.strip()
    else:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=120,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()


def _hash_answer(exercise_id: int, user_answer: str) -> str:
    """Erstellt einen eindeutigen Hash aus Aufgaben-ID und normalisierter Antwort."""
    normalized = f"{exercise_id}::{user_answer.strip().lower()}"
    return hashlib.sha256(normalized.encode()).hexdigest()


def _evaluate_answer(exercise: Exercise, user_answer: str) -> tuple[bool, str]:
    """
    Bewertet die Antwort je nach Übungstyp.
    Gibt (is_correct, correct_answer_str) zurück.
    """
    content = exercise.content
    ex_type = exercise.exercise_type

    if ex_type == "dragdrop":
        # user_answer ist kommaseparierte Reihenfolge der Wörter
        correct_order = content.get("correct_order", [])
        correct_str = ",".join(correct_order)
        user_normalized = ",".join(w.strip() for w in user_answer.split(","))
        is_correct = user_normalized.lower() == correct_str.lower()
        return is_correct, correct_str

    elif ex_type == "flashcard":
        # Bei Karteikarten bewertet sich der Nutzer selbst ("known" oder "unknown")
        is_correct = user_answer.strip().lower() == "known"
        return is_correct, "known"

    elif ex_type == "fillblank":
        correct = content.get("correct_answer", "")
        is_correct = user_answer.strip().lower() == correct.strip().lower()
        return is_correct, correct

    elif ex_type == "declension":
        # user_answer ist der gewählte Kasus (z.B. "akkusativ")
        # Wir prüfen ob der Nutzer den richtigen Kasus für den Kontext gewählt hat
        # Bei Deklinationsaufgaben ist die "Aufgabe" das Anzeigen aller Formen –
        # der Nutzer wählt welche Form zu einem Satz passt
        correct = content.get("correct_answer", content.get("correct", ""))
        is_correct = user_answer.strip().lower() == correct.strip().lower()
        return is_correct, correct

    else:
        # multichoice (Standard) – auch rückwärtskompatibel mit "correct" key
        correct = content.get("correct_answer", content.get("correct", ""))
        is_correct = user_answer.strip().lower() == correct.strip().lower()
        return is_correct, correct


def get_feedback(
    db: Session,
    exercise: Exercise,
    user_answer: str,
    correct_answer: str
) -> dict:
    """
    Gibt Feedback zurück. Nutzt Cache wenn möglich, sonst KI.

    Returns:
        {"is_correct": bool, "feedback": str, "from_cache": bool}
    """
    answer_hash = _hash_answer(exercise.id, user_answer)

    # Cache-Lookup
    cached = db.query(AIFeedbackCache).filter(
        AIFeedbackCache.exercise_id == exercise.id,
        AIFeedbackCache.answer_hash == answer_hash
    ).first()

    if cached:
        return {
            "is_correct": cached.is_correct,
            "feedback": cached.feedback_text,
            "from_cache": True
        }

    # Antwort bewerten (typspezifisch)
    is_correct, resolved_correct = _evaluate_answer(exercise, user_answer)

    # KI-Feedback generieren (nur wenn API-Key vorhanden)
    if os.getenv("OPENAI_API_KEY"):
        feedback_text = _generate_ai_feedback(
            exercise_type=exercise.exercise_type,
            question=exercise.question,
            user_answer=user_answer,
            correct_answer=resolved_correct,
            hint=exercise.content.get("hint", ""),
            example=exercise.content.get("example", ""),
            is_correct=is_correct,
            content=exercise.content
        )
    else:
        # Fallback ohne KI
        hint = exercise.content.get("hint", "")
        example = exercise.content.get("example", "")
        if is_correct:
            feedback_text = f"Richtig! {hint}" + (f" Beispiel: {example}" if example else "")
        else:
            feedback_text = f"Leider falsch. Die richtige Antwort ist '{resolved_correct}'. {hint}"

    # In Cache speichern
    cache_entry = AIFeedbackCache(
        exercise_id=exercise.id,
        answer_hash=answer_hash,
        feedback_text=feedback_text,
        is_correct=is_correct
    )
    db.add(cache_entry)
    db.commit()

    return {
        "is_correct": is_correct,
        "feedback": feedback_text,
        "from_cache": False
    }


def _generate_ai_feedback(
    exercise_type: str,
    question: str,
    user_answer: str,
    correct_answer: str,
    hint: str,
    example: str,
    is_correct: bool,
    content: dict = None
) -> str:
    """Generiert ein kurzes, ermutigendes Feedback auf Deutsch via OpenAI."""
    status = "richtig" if is_correct else "falsch"

    if exercise_type == "flashcard":
        # Karteikarten: kein klassisches Richtig/Falsch-Feedback
        if is_correct:
            prompt = f"""Du bist ein freundlicher Deutschlehrer. Der Lernende hat die Karteikarte "{content.get('front', '')}" als bekannt markiert.
Gib eine kurze Bestätigung (1 Satz) auf Deutsch und nenne die wichtigste Information zur Karte: {content.get('back', '')}
Kein "Hallo", keine Begrüßung."""
        else:
            prompt = f"""Du bist ein freundlicher Deutschlehrer. Der Lernende hat die Karteikarte "{content.get('front', '')}" als unbekannt markiert.
Erkläre kurz (1-2 Sätze) auf Deutsch: {content.get('back', '')}
Kein "Hallo", keine Begrüßung."""

    elif exercise_type == "dragdrop":
        correct_sentence = " ".join(correct_answer.split(","))
        if is_correct:
            prompt = f"""Du bist ein freundlicher Deutschlehrer. Der Lernende hat die Wörter richtig sortiert: "{correct_sentence}".
Lobe kurz (1 Satz) und erkläre die Grammatikregel: {hint}
Kein "Hallo", keine Begrüßung."""
        else:
            user_sentence = " ".join(user_answer.split(","))
            prompt = f"""Du bist ein freundlicher Deutschlehrer. Der Lernende hat die Wörter falsch sortiert.
Falsch: "{user_sentence}"
Richtig: "{correct_sentence}"
Erkläre kurz (1-2 Sätze) warum die richtige Reihenfolge korrekt ist: {hint}
Kein "Hallo", keine Begrüßung."""

    elif exercise_type == "declension":
        prompt = f"""Du bist ein freundlicher Deutschlehrer. Gib ein kurzes Feedback (1-2 Sätze) auf Deutsch.
Frage: {question}
Antwort des Lernenden: {user_answer}
Richtige Antwort: {correct_answer}
Die Antwort war: {status}
Hinweis: {hint}
Kein "Hallo", keine Begrüßung."""

    else:
        # multichoice und fillblank
        prompt = f"""Du bist ein freundlicher Deutschlehrer. Gib ein sehr kurzes Feedback (1-2 Sätze) auf Deutsch.

Frage: {question}
Antwort des Lernenden: {user_answer}
Richtige Antwort: {correct_answer}
Die Antwort war: {status}
Hinweis: {hint}
Beispielsatz: {example}

Regeln:
- Wenn richtig: kurz loben und den Grund erklären.
- Wenn falsch: freundlich korrigieren und den Grund erklären.
- Maximal 2 Sätze.
- Kein "Hallo", keine Begrüßung."""

    try:
        return _call_openai(prompt)
    except Exception as e:
        logger.error(f"OpenAI API Fehler: {e}")
        if is_correct:
            return f"Richtig! {hint}"
        else:
            return f"Leider falsch. Die richtige Antwort ist '{correct_answer}'. {hint}"
