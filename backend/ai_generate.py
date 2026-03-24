"""
KI-gestützte Aufgabengenerierung für Artikeltrainer.de

Die KI generiert neue Übungsaufgaben basierend auf Kategorie und Typ.
Alle generierten Aufgaben landen im Status "draft" und müssen
vom Admin freigegeben werden.
"""

import json
import logging
import os
from typing import List, Optional

logger = logging.getLogger(__name__)

# Lazy initialization
_client = None


def _get_client():
    global _client
    if _client is None:
        from openai import OpenAI
        key = os.getenv("OPENAI_API_KEY", "")
        _client = OpenAI(api_key=key)
    return _client


def _call_openai(prompt: str, max_tokens: int = 3000) -> str:
    """Ruft OpenAI auf – kompatibel mit v1.x und v2.x."""
    import openai
    client = _get_client()
    version = tuple(int(x) for x in openai.__version__.split('.')[:2])
    if version >= (2, 0):
        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
            max_output_tokens=max_tokens
        )
        return response.output_text.strip()
    else:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.8
        )
        return response.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Prompts je Kategorie / Übungstyp
# ---------------------------------------------------------------------------

PROMPTS = {
    "artikel": """Du bist ein Deutschlehrer. Erstelle GENAU {count} Multiple-Choice-Aufgaben zum Thema "Artikel im Deutschen" (der/die/das).

WICHTIGE REGELN:
- Alle Texte (Frage, Hinweis, Beispielsatz) sind auf DEUTSCH
- Jede Aufgabe fragt nach dem richtigen Artikel eines deutschen Substantivs
- Wähle alltagsnahe, häufig verwendete Wörter
- Verschiedene Schwierigkeitsgrade mischen (einfach: Haus, Tisch; mittel: Fenster, Schlüssel; schwer: Anlass, Genehmigung)
- Keine Wörter wiederholen
- Die Antwortoptionen sind immer genau: ["der", "die", "das"]
- Es MÜSSEN GENAU {count} Aufgaben im Array sein

Antworte NUR mit einem gültigen JSON-Array ohne Erklärungen oder Markdown:
[
  {{
    "question": "Welcher Artikel gehört zu 'Tisch'?",
    "options": ["der", "die", "das"],
    "correct_answer": "der",
    "hint": "Tisch ist maskulin – viele Möbel und Alltagsgegenstände sind maskulin.",
    "example": "Der Tisch steht im Wohnzimmer.",
    "difficulty": 1000
  }}
]

Schwierigkeitswerte: einfach=800, mittel=1000, schwer=1200
Erstelle jetzt GENAU {count} Aufgaben:""",

    "wortschatz": """Du bist ein Deutschlehrer. Erstelle GENAU {count} Multiple-Choice-Aufgaben zum deutschen Wortschatz.

WICHTIGE REGELN:
- Alle Texte (Frage, Antwortoptionen, Hinweis, Beispielsatz) sind AUSSCHLIESSLICH auf DEUTSCH
- KEINE englischen Übersetzungen als Antwortoptionen
- Aufgabentypen mischen: Synonyme, Antonyme, Bedeutungserklärungen, Wortfamilien
- Beispiele für erlaubte Aufgabentypen:
  * "Was ist ein Synonym für 'schnell'?" → Optionen: "rasch", "langsam", "groß", "klein"
  * "Was ist das Gegenteil von 'hell'?" → Optionen: "dunkel", "laut", "warm", "kalt"
  * "Was bedeutet 'erschöpft'?" → Optionen: "sehr müde", "sehr hungrig", "sehr fröhlich", "sehr wütend"
  * "Welches Wort passt? 'Das Kind ___ auf dem Spielplatz.'" → Optionen: "spielt", "schläft", "isst", "liest"
- Verschiedene Niveaus mischen (A1–B2)
- Es MÜSSEN GENAU {count} Aufgaben im Array sein

Antworte NUR mit einem gültigen JSON-Array ohne Erklärungen oder Markdown:
[
  {{
    "question": "Was ist ein Synonym für 'schnell'?",
    "options": ["rasch", "langsam", "groß", "leise"],
    "correct_answer": "rasch",
    "hint": "Rasch und schnell bedeuten beide, dass etwas in kurzer Zeit passiert.",
    "example": "Er läuft sehr rasch / schnell.",
    "difficulty": 900
  }}
]

Schwierigkeitswerte: A1=800, A2=900, B1=1000, B2=1200
Erstelle jetzt GENAU {count} Aufgaben:""",

    "grammatik": """Du bist ein Deutschlehrer. Erstelle GENAU {count} Multiple-Choice-Aufgaben zur deutschen Grammatik.

WICHTIGE REGELN:
- Alle Texte (Frage, Antwortoptionen, Hinweis, Beispielsatz) sind AUSSCHLIESSLICH auf DEUTSCH
- Themen mischen: Verb-Konjugation, Kasus (Nominativ/Akkusativ/Dativ), Pluralformen, Adjektivdeklination, Präpositionen, Zeitformen
- Es MÜSSEN GENAU {count} Aufgaben im Array sein

Antworte NUR mit einem gültigen JSON-Array ohne Erklärungen oder Markdown:
[
  {{
    "question": "Welche Form ist korrekt? 'Ich ___ gestern ins Kino gegangen.'",
    "options": ["bin", "habe", "war", "hatte"],
    "correct_answer": "bin",
    "hint": "Bewegungsverben wie 'gehen' bilden das Perfekt mit 'sein', nicht mit 'haben'.",
    "example": "Ich bin gestern ins Kino gegangen.",
    "difficulty": 1100
  }}
]

Schwierigkeitswerte: einfach=800, mittel=1000, schwer=1300
Erstelle jetzt GENAU {count} Aufgaben:"""
}

DEFAULT_PROMPT = """Du bist ein Deutschlehrer. Erstelle GENAU {count} Multiple-Choice-Aufgaben zum Thema "{category_name}" für Deutschlernende.

WICHTIGE REGELN:
- Alle Texte sind AUSSCHLIESSLICH auf DEUTSCH
- KEINE englischen Übersetzungen als Antwortoptionen
- Es MÜSSEN GENAU {count} Aufgaben im Array sein

Antworte NUR mit einem gültigen JSON-Array ohne Erklärungen oder Markdown:
[
  {{
    "question": "Beispielfrage auf Deutsch?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "hint": "Kurze Erklärung auf Deutsch warum die Antwort richtig ist.",
    "example": "Beispielsatz auf Deutsch.",
    "difficulty": 1000
  }}
]

Erstelle jetzt GENAU {count} Aufgaben:"""


# ---------------------------------------------------------------------------
# Hauptfunktion
# ---------------------------------------------------------------------------

def generate_exercises(
    category_slug: str,
    category_name: str,
    count: int = 5,
    existing_questions: Optional[List[str]] = None,
    max_retries: int = 2
) -> List[dict]:
    """
    Generiert neue Übungsaufgaben via KI.

    Args:
        category_slug: Slug der Kategorie (z.B. "artikel")
        category_name: Anzeigename (z.B. "Artikel")
        count: Anzahl zu generierender Aufgaben
        existing_questions: Liste bestehender Fragen (für Duplikat-Vermeidung)
        max_retries: Wie oft nachgeneriert wird wenn zu wenige Aufgaben kommen

    Returns:
        Liste von Aufgaben-Dicts, bereit zum Speichern in der DB
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY nicht gesetzt")

    # Prompt auswählen
    prompt_template = PROMPTS.get(category_slug, DEFAULT_PROMPT)

    # Bestehende Fragen als Kontext (Duplikat-Vermeidung)
    existing_set = set()
    existing_hint = ""
    if existing_questions:
        existing_set = {q.lower() for q in existing_questions}
        sample = existing_questions[:15]
        existing_hint = f"\n\nBereits vorhandene Fragen (NICHT wiederholen):\n" + "\n".join(f"- {q}" for q in sample)

    all_results = []
    remaining = count
    attempt = 0

    while remaining > 0 and attempt <= max_retries:
        attempt += 1
        prompt = prompt_template.format(count=remaining, category_name=category_name)
        prompt += existing_hint

        logger.info(f"Generiere {remaining} Aufgaben für '{category_slug}' (Versuch {attempt})...")

        try:
            raw = _call_openai(prompt, max_tokens=3000)
            exercises = _parse_response(raw)
        except Exception as e:
            logger.error(f"KI-Fehler bei Versuch {attempt}: {e}")
            if attempt > max_retries:
                raise
            continue

        # Duplikate filtern (gegen bestehende UND bereits generierte)
        already_generated = {ex["question"].lower() for ex in all_results}
        new_exercises = []
        for ex in exercises:
            q_lower = ex.get("question", "").lower()
            if q_lower not in existing_set and q_lower not in already_generated:
                new_exercises.append(ex)
                already_generated.add(q_lower)

        all_results.extend(new_exercises)
        remaining = count - len(all_results)

        if remaining > 0 and attempt <= max_retries:
            logger.info(f"Nur {len(new_exercises)} neue Aufgaben erhalten, {remaining} fehlen noch – Nachgenerierung...")
            # Bereits generierte auch als "vorhanden" markieren
            existing_hint += "\n" + "\n".join(f"- {ex['question']}" for ex in all_results)

    logger.info(f"Gesamt generiert: {len(all_results)} Aufgaben (Ziel war {count})")
    return all_results[:count]  # Nie mehr als angefordert zurückgeben


def _parse_response(raw: str) -> List[dict]:
    """Parst die KI-Antwort und extrahiert das JSON-Array."""
    raw = raw.strip()

    # Markdown-Code-Blöcke entfernen
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Erste und letzte Zeile (``` und ```) entfernen
        inner = lines[1:]
        if inner and inner[-1].strip() == "```":
            inner = inner[:-1]
        raw = "\n".join(inner)

    # JSON-Array finden
    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError(f"Kein JSON-Array in der KI-Antwort gefunden: {raw[:200]}")

    json_str = raw[start:end]

    try:
        exercises = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON-Parsing fehlgeschlagen: {e}\nRaw: {json_str[:300]}")

    # Validierung und Normalisierung
    validated = []
    for ex in exercises:
        if not isinstance(ex, dict):
            continue
        if not ex.get("question") or not ex.get("correct_answer"):
            continue
        if not ex.get("options") or len(ex["options"]) < 2:
            continue

        validated.append({
            "question": str(ex["question"]).strip(),
            "options": [str(o).strip() for o in ex["options"]],
            "correct_answer": str(ex["correct_answer"]).strip(),
            "hint": str(ex.get("hint", "")).strip(),
            "example": str(ex.get("example", "")).strip(),
            "difficulty": float(ex.get("difficulty", 1000.0))
        })

    return validated
