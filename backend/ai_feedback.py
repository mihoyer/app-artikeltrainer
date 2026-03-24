"""
KI-gestütztes Feedback mit Caching.

Ablauf:
1. Nutzerantwort wird gehasht.
2. Prüfe ob Hash bereits in der Datenbank (Cache-Hit) → sofort zurückgeben.
3. Falls nicht → OpenAI API anfragen → Ergebnis speichern (Cache-Miss).
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
        # OpenAI SDK v2.x: responses API
        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
            max_output_tokens=100
        )
        return response.output_text.strip()
    else:
        # OpenAI SDK v1.x: chat.completions API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()


def _hash_answer(exercise_id: int, user_answer: str) -> str:
    """Erstellt einen eindeutigen Hash aus Aufgaben-ID und normalisierter Antwort."""
    normalized = f"{exercise_id}::{user_answer.strip().lower()}"
    return hashlib.sha256(normalized.encode()).hexdigest()


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

    # Einfache Auswertung für Multiple Choice (kein KI nötig)
    is_correct = user_answer.strip().lower() == correct_answer.strip().lower()

    # KI-Feedback generieren (nur wenn API-Key vorhanden)
    if os.getenv("OPENAI_API_KEY"):
        feedback_text = _generate_ai_feedback(
            question=exercise.question,
            user_answer=user_answer,
            correct_answer=correct_answer,
            hint=exercise.content.get("hint", ""),
            example=exercise.content.get("example", ""),
            is_correct=is_correct
        )
    else:
        # Fallback ohne KI
        if is_correct:
            feedback_text = f"Richtig! {exercise.content.get('hint', '')} Beispiel: {exercise.content.get('example', '')}"
        else:
            feedback_text = f"Leider falsch. Die richtige Antwort ist '{correct_answer}'. {exercise.content.get('hint', '')} Beispiel: {exercise.content.get('example', '')}"

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
    question: str,
    user_answer: str,
    correct_answer: str,
    hint: str,
    example: str,
    is_correct: bool
) -> str:
    """Generiert ein kurzes, ermutigendes Feedback auf Deutsch via OpenAI."""
    status = "richtig" if is_correct else "falsch"
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
        # Fallback bei API-Fehler
        if is_correct:
            return f"Richtig! {hint}"
        else:
            return f"Leider falsch. Die richtige Antwort ist '{correct_answer}'. {hint}"
