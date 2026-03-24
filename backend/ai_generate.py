"""
KI-gestützte Aufgabengenerierung für Artikeltrainer.de

Die KI generiert neue Übungsaufgaben basierend auf Kategorie und Typ.
Alle generierten Aufgaben landen im Status "draft" und müssen
vom Admin freigegeben werden.

Unterstützte Übungstypen:
  - multichoice  : Multiple-Choice (bestehend)
  - dragdrop     : Drag & Drop – Wörter in die richtige Reihenfolge/Position ziehen
  - flashcard    : Karteikarten – Vorderseite/Rückseite
  - fillblank    : Lückentext – Satz mit einer oder mehreren Lücken
  - declension   : Deklination – Kasus-Tabelle mit Satzbeispielen
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
# Prompts: Multiple Choice (bestehend)
# ---------------------------------------------------------------------------

PROMPTS_MULTICHOICE = {
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

DEFAULT_PROMPT_MULTICHOICE = """Du bist ein Deutschlehrer. Erstelle GENAU {count} Multiple-Choice-Aufgaben zum Thema "{category_name}" für Deutschlernende.

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
# Prompts: Drag & Drop
# ---------------------------------------------------------------------------

PROMPT_DRAGDROP = """Du bist ein Deutschlehrer. Erstelle GENAU {count} Drag-&-Drop-Aufgaben für Deutschlernende zum Thema "{category_name}".

Bei Drag & Drop muss der Lernende Wörter oder Wortteile in die richtige Reihenfolge bringen, um einen korrekten deutschen Satz zu bilden.

REGELN:
- Alle Texte sind AUSSCHLIESSLICH auf DEUTSCH
- "words" ist ein Array der Wörter in ZUFÄLLIGER (gemischter) Reihenfolge – der Lernende muss sie sortieren
- "correct_order" ist ein Array derselben Wörter in der RICHTIGEN Reihenfolge
- Der Satz soll grammatikalisch korrekt und sinnvoll sein
- Schwierigkeitsgrade mischen: einfach (3-4 Wörter), mittel (5-6 Wörter), schwer (7-8 Wörter)
- Es MÜSSEN GENAU {count} Aufgaben im Array sein

Antworte NUR mit einem gültigen JSON-Array ohne Erklärungen oder Markdown:
[
  {{
    "question": "Bringe die Wörter in die richtige Reihenfolge:",
    "words": ["Wohnzimmer", "steht", "im", "Der", "Tisch"],
    "correct_order": ["Der", "Tisch", "steht", "im", "Wohnzimmer"],
    "hint": "Im Deutschen steht das Verb an zweiter Stelle im Hauptsatz.",
    "example": "Der Tisch steht im Wohnzimmer.",
    "difficulty": 1000
  }}
]

Schwierigkeitswerte: einfach=800, mittel=1000, schwer=1200
Erstelle jetzt GENAU {count} Aufgaben:"""


# ---------------------------------------------------------------------------
# Prompts: Karteikarten (Flashcards)
# ---------------------------------------------------------------------------

PROMPT_FLASHCARD = """Du bist ein Deutschlehrer. Erstelle GENAU {count} Karteikarten-Aufgaben für Deutschlernende zum Thema "{category_name}".

Bei Karteikarten sieht der Lernende zuerst die Vorderseite (front) und muss die Rückseite (back) kennen. Dann kann er aufdecken und sich selbst bewerten.

REGELN:
- Alle Texte sind AUSSCHLIESSLICH auf DEUTSCH
- "front": Das Wort oder der Begriff, der gelernt werden soll (z.B. ein Nomen mit Artikel)
- "back": Die vollständige Erklärung/Definition auf Deutsch (KEIN Englisch!)
- "example": Ein natürlicher Beispielsatz mit dem Wort
- "hint": Eine kurze Gedächtnisstütze oder Eselsbrücke
- Für Artikel-Kategorien: front = "das Fenster", back = "Neutrum – Öffnung in einer Wand, durch die Licht fällt"
- Verschiedene Wortarten und Themen mischen
- Es MÜSSEN GENAU {count} Aufgaben im Array sein

Antworte NUR mit einem gültigen JSON-Array ohne Erklärungen oder Markdown:
[
  {{
    "question": "Kennst du dieses Wort?",
    "front": "das Fenster",
    "back": "Neutrum – eine Öffnung in einer Wand, durch die Licht und Luft hereinkommen",
    "hint": "Wörter auf '-er' sind oft maskulin, aber 'Fenster' ist eine Ausnahme (Neutrum).",
    "example": "Das Fenster ist offen – es ist warm draußen.",
    "difficulty": 900
  }}
]

Schwierigkeitswerte: A1=800, A2=900, B1=1000, B2=1200
Erstelle jetzt GENAU {count} Aufgaben:"""


# ---------------------------------------------------------------------------
# Prompts: Lückentext (Fill in the Blank)
# ---------------------------------------------------------------------------

PROMPT_FILLBLANK = """Du bist ein Deutschlehrer. Erstelle GENAU {count} Lückentext-Aufgaben für Deutschlernende zum Thema "{category_name}".

Bei Lückentexten muss der Lernende das fehlende Wort oder die fehlende Form in eine Lücke eintragen.

REGELN:
- Alle Texte sind AUSSCHLIESSLICH auf DEUTSCH
- "sentence": Der Satz MIT der Lücke, markiert als "___" (drei Unterstriche)
- "correct_answer": Das korrekte Wort/die korrekte Form für die Lücke
- "options": 4 Antwortmöglichkeiten (inkl. correct_answer) – der Lernende wählt eine aus
- "hint": Grammatikalische Erklärung warum diese Form korrekt ist
- "example": Der vollständige korrekte Satz
- Themen: Artikel (der/die/das/dem/den), Verbformen, Adjektivendungen, Präpositionen
- Es MÜSSEN GENAU {count} Aufgaben im Array sein

Antworte NUR mit einem gültigen JSON-Array ohne Erklärungen oder Markdown:
[
  {{
    "question": "Wähle die richtige Form für die Lücke:",
    "sentence": "Ich gebe ___ Kind ein Buch.",
    "correct_answer": "dem",
    "options": ["dem", "den", "der", "das"],
    "hint": "Nach 'geben' steht das indirekte Objekt im Dativ. 'Kind' ist Neutrum → Dativ: 'dem'.",
    "example": "Ich gebe dem Kind ein Buch.",
    "difficulty": 1100
  }}
]

Schwierigkeitswerte: einfach=800, mittel=1000, schwer=1300
Erstelle jetzt GENAU {count} Aufgaben:"""


# ---------------------------------------------------------------------------
# Prompts: Deklination (Declension)
# ---------------------------------------------------------------------------

PROMPT_DECLENSION = """Du bist ein Deutschlehrer. Erstelle GENAU {count} Deklinationsaufgaben für Deutschlernende zum Thema "{category_name}".

Bei Deklinationsaufgaben sieht der Lernende ein Nomen und muss die richtige deklinierte Form in einem Satzbeispiel wählen.

REGELN:
- Alle Texte sind AUSSCHLIESSLICH auf DEUTSCH
- "noun": Das Nomen im Nominativ Singular mit Artikel (z.B. "der Hund")
- "gender": Genus ("maskulin", "feminin" oder "neutrum")
- "cases": Objekt mit den vier Kasus-Formen im Singular:
    - "nominativ": z.B. "der Hund"
    - "akkusativ": z.B. "den Hund"
    - "dativ": z.B. "dem Hund"
    - "genitiv": z.B. "des Hundes"
- "sentences": Array mit GENAU 4 Satzbeispielen, je einer pro Kasus, in der Reihenfolge [Nominativ, Akkusativ, Dativ, Genitiv]
- "question": Erkläre welches Nomen dekliniert wird
- "hint": Kurze Erklärung der Deklinationsregel für dieses Genus
- "difficulty": Schwierigkeitswert

Antworte NUR mit einem gültigen JSON-Array ohne Erklärungen oder Markdown:
[
  {{
    "question": "Wie wird 'der Hund' in den vier Fällen dekliniert?",
    "noun": "der Hund",
    "gender": "maskulin",
    "cases": {{
      "nominativ": "der Hund",
      "akkusativ": "den Hund",
      "dativ": "dem Hund",
      "genitiv": "des Hundes"
    }},
    "sentences": [
      "Der Hund bellt laut.",
      "Ich sehe den Hund im Park.",
      "Ich gebe dem Hund einen Knochen.",
      "Das Fell des Hundes ist braun."
    ],
    "hint": "Maskuline Nomen: Nominativ 'der', Akkusativ 'den', Dativ 'dem', Genitiv 'des + -(e)s'.",
    "example": "Der Hund bellt laut. / Ich sehe den Hund.",
    "difficulty": 1100
  }}
]

Schwierigkeitswerte: einfach=800, mittel=1000, schwer=1300
Erstelle jetzt GENAU {count} Aufgaben:"""


# ---------------------------------------------------------------------------
# Hauptfunktionen
# ---------------------------------------------------------------------------

def generate_exercises(
    category_slug: str,
    category_name: str,
    count: int = 5,
    existing_questions: Optional[List[str]] = None,
    max_retries: int = 2,
    exercise_type: str = "multichoice"
) -> List[dict]:
    """
    Generiert neue Übungsaufgaben via KI.

    Args:
        category_slug: Slug der Kategorie (z.B. "artikel")
        category_name: Anzeigename (z.B. "Artikel")
        count: Anzahl zu generierender Aufgaben
        existing_questions: Liste bestehender Fragen (für Duplikat-Vermeidung)
        max_retries: Wie oft nachgeneriert wird wenn zu wenige Aufgaben kommen
        exercise_type: Übungstyp (multichoice|dragdrop|flashcard|fillblank|declension)

    Returns:
        Liste von Aufgaben-Dicts, bereit zum Speichern in der DB
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY nicht gesetzt")

    # Prompt je Typ auswählen
    if exercise_type == "dragdrop":
        prompt_template = PROMPT_DRAGDROP
    elif exercise_type == "flashcard":
        prompt_template = PROMPT_FLASHCARD
    elif exercise_type == "fillblank":
        prompt_template = PROMPT_FILLBLANK
    elif exercise_type == "declension":
        prompt_template = PROMPT_DECLENSION
    else:
        # multichoice (Standard)
        prompt_template = PROMPTS_MULTICHOICE.get(category_slug, DEFAULT_PROMPT_MULTICHOICE)

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

        logger.info(f"Generiere {remaining} '{exercise_type}'-Aufgaben für '{category_slug}' (Versuch {attempt})...")

        try:
            raw = _call_openai(prompt, max_tokens=4000)
            exercises = _parse_response(raw, exercise_type)
        except Exception as e:
            logger.error(f"KI-Fehler bei Versuch {attempt}: {e}")
            if attempt > max_retries:
                raise
            continue

        # Duplikate filtern
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
            existing_hint += "\n" + "\n".join(f"- {ex['question']}" for ex in all_results)

    logger.info(f"Gesamt generiert: {len(all_results)} Aufgaben (Ziel war {count})")
    return all_results[:count]


def _parse_response(raw: str, exercise_type: str = "multichoice") -> List[dict]:
    """Parst die KI-Antwort und extrahiert das JSON-Array."""
    raw = raw.strip()

    # Markdown-Code-Blöcke entfernen
    if raw.startswith("```"):
        lines = raw.split("\n")
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

    validated = []
    for ex in exercises:
        if not isinstance(ex, dict):
            continue
        if not ex.get("question"):
            continue

        parsed = _validate_by_type(ex, exercise_type)
        if parsed:
            validated.append(parsed)

    return validated


def _validate_by_type(ex: dict, exercise_type: str) -> Optional[dict]:
    """Validiert und normalisiert eine Aufgabe je nach Typ."""

    base = {
        "question": str(ex.get("question", "")).strip(),
        "hint": str(ex.get("hint", "")).strip(),
        "example": str(ex.get("example", "")).strip(),
        "difficulty": float(ex.get("difficulty", 1000.0))
    }

    if exercise_type == "multichoice":
        if not ex.get("correct_answer") or not ex.get("options") or len(ex["options"]) < 2:
            return None
        return {
            **base,
            "options": [str(o).strip() for o in ex["options"]],
            "correct_answer": str(ex["correct_answer"]).strip(),
        }

    elif exercise_type == "dragdrop":
        if not ex.get("words") or not ex.get("correct_order"):
            return None
        if len(ex["words"]) < 2:
            return None
        return {
            **base,
            "words": [str(w).strip() for w in ex["words"]],
            "correct_order": [str(w).strip() for w in ex["correct_order"]],
        }

    elif exercise_type == "flashcard":
        if not ex.get("front") or not ex.get("back"):
            return None
        return {
            **base,
            "front": str(ex["front"]).strip(),
            "back": str(ex["back"]).strip(),
        }

    elif exercise_type == "fillblank":
        if not ex.get("sentence") or not ex.get("correct_answer"):
            return None
        if "___" not in str(ex.get("sentence", "")):
            return None
        return {
            **base,
            "sentence": str(ex["sentence"]).strip(),
            "correct_answer": str(ex["correct_answer"]).strip(),
            "options": [str(o).strip() for o in ex.get("options", [])],
        }

    elif exercise_type == "declension":
        if not ex.get("noun") or not ex.get("cases") or not ex.get("sentences"):
            return None
        cases = ex["cases"]
        required_cases = ["nominativ", "akkusativ", "dativ", "genitiv"]
        if not all(k in cases for k in required_cases):
            return None
        sentences = ex.get("sentences", [])
        if len(sentences) < 4:
            return None
        return {
            **base,
            "noun": str(ex["noun"]).strip(),
            "gender": str(ex.get("gender", "")).strip(),
            "cases": {k: str(cases[k]).strip() for k in required_cases},
            "sentences": [str(s).strip() for s in sentences[:4]],
        }

    return None
