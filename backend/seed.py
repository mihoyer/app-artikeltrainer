"""Seed-Skript: Legt Kategorien und erste Übungsaufgaben an."""
from database import SessionLocal, init_db
from models import Category, Exercise

CATEGORIES = [
    {"slug": "artikel", "name": "Artikel", "description": "Trainiere der, die, das", "icon": "🎯"},
    {"slug": "wortschatz", "name": "Wortschatz", "description": "Erweitere deinen Wortschatz", "icon": "📖"},
    {"slug": "grammatik", "name": "Grammatik", "description": "Übe Grammatikregeln", "icon": "✏️"},
]

# Artikel-Übungen (Multiple Choice: der/die/das)
ARTIKEL_EXERCISES = [
    # difficulty ~800 (leicht)
    {"question": "Welcher Artikel gehört zu 'Tisch'?", "content": {"options": ["der", "die", "das"], "correct": "der", "example": "Der Tisch ist groß.", "hint": "Tisch ist maskulin."}, "difficulty": 800},
    {"question": "Welcher Artikel gehört zu 'Frau'?", "content": {"options": ["der", "die", "das"], "correct": "die", "example": "Die Frau lacht.", "hint": "Frau ist feminin."}, "difficulty": 800},
    {"question": "Welcher Artikel gehört zu 'Kind'?", "content": {"options": ["der", "die", "das"], "correct": "das", "example": "Das Kind spielt.", "hint": "Kind ist neutral."}, "difficulty": 800},
    {"question": "Welcher Artikel gehört zu 'Mann'?", "content": {"options": ["der", "die", "das"], "correct": "der", "example": "Der Mann arbeitet.", "hint": "Mann ist maskulin."}, "difficulty": 800},
    {"question": "Welcher Artikel gehört zu 'Schule'?", "content": {"options": ["der", "die", "das"], "correct": "die", "example": "Die Schule beginnt um 8 Uhr.", "hint": "Schule ist feminin."}, "difficulty": 850},
    {"question": "Welcher Artikel gehört zu 'Buch'?", "content": {"options": ["der", "die", "das"], "correct": "das", "example": "Das Buch ist interessant.", "hint": "Buch ist neutral."}, "difficulty": 850},
    {"question": "Welcher Artikel gehört zu 'Auto'?", "content": {"options": ["der", "die", "das"], "correct": "das", "example": "Das Auto fährt schnell.", "hint": "Auto ist neutral."}, "difficulty": 850},
    {"question": "Welcher Artikel gehört zu 'Hund'?", "content": {"options": ["der", "die", "das"], "correct": "der", "example": "Der Hund bellt.", "hint": "Hund ist maskulin."}, "difficulty": 900},
    {"question": "Welcher Artikel gehört zu 'Katze'?", "content": {"options": ["der", "die", "das"], "correct": "die", "example": "Die Katze schläft.", "hint": "Katze ist feminin."}, "difficulty": 900},
    {"question": "Welcher Artikel gehört zu 'Haus'?", "content": {"options": ["der", "die", "das"], "correct": "das", "example": "Das Haus ist groß.", "hint": "Haus ist neutral."}, "difficulty": 900},
    # difficulty ~1000 (mittel)
    {"question": "Welcher Artikel gehört zu 'Schlüssel'?", "content": {"options": ["der", "die", "das"], "correct": "der", "example": "Ich suche den Schlüssel.", "hint": "Schlüssel ist maskulin."}, "difficulty": 1000},
    {"question": "Welcher Artikel gehört zu 'Brücke'?", "content": {"options": ["der", "die", "das"], "correct": "die", "example": "Die Brücke ist alt.", "hint": "Brücke ist feminin – Wörter auf -e sind oft feminin."}, "difficulty": 1000},
    {"question": "Welcher Artikel gehört zu 'Fenster'?", "content": {"options": ["der", "die", "das"], "correct": "das", "example": "Das Fenster ist offen.", "hint": "Fenster ist neutral."}, "difficulty": 1000},
    {"question": "Welcher Artikel gehört zu 'Garten'?", "content": {"options": ["der", "die", "das"], "correct": "der", "example": "Der Garten blüht.", "hint": "Garten ist maskulin."}, "difficulty": 1050},
    {"question": "Welcher Artikel gehört zu 'Küche'?", "content": {"options": ["der", "die", "das"], "correct": "die", "example": "Die Küche riecht gut.", "hint": "Küche ist feminin."}, "difficulty": 1050},
    {"question": "Welcher Artikel gehört zu 'Zimmer'?", "content": {"options": ["der", "die", "das"], "correct": "das", "example": "Das Zimmer ist aufgeräumt.", "hint": "Zimmer ist neutral – Verkleinerungsformen auf -er oft neutral."}, "difficulty": 1050},
    # difficulty ~1200 (schwer)
    {"question": "Welcher Artikel gehört zu 'Entscheidung'?", "content": {"options": ["der", "die", "das"], "correct": "die", "example": "Die Entscheidung war schwer.", "hint": "Nomen auf -ung sind immer feminin."}, "difficulty": 1200},
    {"question": "Welcher Artikel gehört zu 'Ergebnis'?", "content": {"options": ["der", "die", "das"], "correct": "das", "example": "Das Ergebnis überrascht mich.", "hint": "Nomen auf -nis sind meist neutral."}, "difficulty": 1200},
    {"question": "Welcher Artikel gehört zu 'Fortschritt'?", "content": {"options": ["der", "die", "das"], "correct": "der", "example": "Der Fortschritt ist sichtbar.", "hint": "Fortschritt ist maskulin."}, "difficulty": 1250},
    {"question": "Welcher Artikel gehört zu 'Möglichkeit'?", "content": {"options": ["der", "die", "das"], "correct": "die", "example": "Die Möglichkeit besteht.", "hint": "Nomen auf -keit sind immer feminin."}, "difficulty": 1250},
]

# Wortschatz-Übungen (Multiple Choice: Synonym / Bedeutung)
WORTSCHATZ_EXERCISES = [
    {"question": "Was bedeutet 'groß'?", "content": {"options": ["klein", "tall/big", "schnell", "laut"], "correct": "tall/big", "example": "Das Haus ist groß.", "hint": "Gegenteil von 'klein'."}, "difficulty": 800},
    {"question": "Was ist ein Synonym für 'beginnen'?", "content": {"options": ["enden", "starten", "warten", "schlafen"], "correct": "starten", "example": "Wir beginnen / starten das Spiel.", "hint": "Denk an 'Start'."}, "difficulty": 900},
    {"question": "Was ist ein Synonym für 'sprechen'?", "content": {"options": ["hören", "sehen", "reden", "schreiben"], "correct": "reden", "example": "Wir sprechen / reden über das Wetter.", "hint": "Umgangssprachliches Wort für 'sprechen'."}, "difficulty": 900},
    {"question": "Was ist das Gegenteil von 'schnell'?", "content": {"options": ["laut", "langsam", "groß", "kalt"], "correct": "langsam", "example": "Das Auto fährt langsam.", "hint": "Denk an 'Slow Motion'."}, "difficulty": 850},
    {"question": "Was ist ein Synonym für 'kaufen'?", "content": {"options": ["verkaufen", "erwerben", "verlieren", "finden"], "correct": "erwerben", "example": "Ich kaufe / erwerbe ein Buch.", "hint": "Formelleres Wort für 'kaufen'."}, "difficulty": 1100},
    {"question": "Was bedeutet 'erschöpft'?", "content": {"options": ["glücklich", "sehr müde", "wütend", "hungrig"], "correct": "sehr müde", "example": "Nach der Arbeit bin ich erschöpft.", "hint": "Stärker als 'müde'."}, "difficulty": 1100},
    {"question": "Was ist ein Synonym für 'wichtig'?", "content": {"options": ["unwichtig", "bedeutsam", "klein", "leise"], "correct": "bedeutsam", "example": "Das ist eine wichtige / bedeutsame Entscheidung.", "hint": "Formelleres Wort."}, "difficulty": 1200},
    {"question": "Was ist das Gegenteil von 'antworten'?", "content": {"options": ["fragen", "hören", "schreiben", "lesen"], "correct": "fragen", "example": "Ich frage, du antwortest.", "hint": "Was kommt vor einer Antwort?"}, "difficulty": 950},
]

# Grammatik-Übungen (Multiple Choice: Verbkonjugation, Kasus)
GRAMMATIK_EXERCISES = [
    {"question": "Ergänze: 'Ich ___ Deutsch.' (lernen)", "content": {"options": ["lernst", "lerne", "lernt", "lernen"], "correct": "lerne", "example": "Ich lerne Deutsch.", "hint": "1. Person Singular: ich lerne."}, "difficulty": 800},
    {"question": "Ergänze: 'Er ___ gern Musik.' (hören)", "content": {"options": ["höre", "hörst", "hört", "hören"], "correct": "hört", "example": "Er hört gern Musik.", "hint": "3. Person Singular: er/sie/es hört."}, "difficulty": 800},
    {"question": "Ergänze: 'Wir ___ ins Kino.' (gehen)", "content": {"options": ["gehe", "gehst", "geht", "gehen"], "correct": "gehen", "example": "Wir gehen ins Kino.", "hint": "1. Person Plural: wir gehen."}, "difficulty": 850},
    {"question": "Welche Form ist richtig? 'Ich sehe ___ Mann.'", "content": {"options": ["der", "die", "den", "dem"], "correct": "den", "example": "Ich sehe den Mann. (Akkusativ)", "hint": "Nach 'sehen' steht der Akkusativ. Maskulin im Akkusativ: den."}, "difficulty": 1100},
    {"question": "Welche Form ist richtig? 'Er hilft ___ Frau.'", "content": {"options": ["die", "der", "den", "das"], "correct": "der", "example": "Er hilft der Frau. (Dativ)", "hint": "Nach 'helfen' steht der Dativ. Feminin im Dativ: der."}, "difficulty": 1200},
    {"question": "Ergänze: 'Du ___ sehr gut.' (sein)", "content": {"options": ["bin", "bist", "ist", "sind"], "correct": "bist", "example": "Du bist sehr gut.", "hint": "2. Person Singular von 'sein': du bist."}, "difficulty": 900},
    {"question": "Ergänze: 'Sie (Pl.) ___ aus Deutschland.' (kommen)", "content": {"options": ["komme", "kommst", "kommt", "kommen"], "correct": "kommen", "example": "Sie kommen aus Deutschland.", "hint": "3. Person Plural: sie kommen."}, "difficulty": 900},
    {"question": "Welche Präposition passt? 'Ich fahre ___ Berlin.'", "content": {"options": ["in", "nach", "zu", "bei"], "correct": "nach", "example": "Ich fahre nach Berlin.", "hint": "Bei Städten und Ländern (ohne Artikel) benutzt man 'nach'."}, "difficulty": 1050},
    {"question": "Welche Form ist richtig? 'Das Buch gehört ___ Kind.'", "content": {"options": ["das", "dem", "den", "die"], "correct": "dem", "example": "Das Buch gehört dem Kind. (Dativ)", "hint": "Nach 'gehören' steht der Dativ. Neutral im Dativ: dem."}, "difficulty": 1200},
    {"question": "Ergänze: 'Gestern ___ ich ins Kino gegangen.' (sein)", "content": {"options": ["habe", "bin", "war", "wurde"], "correct": "bin", "example": "Gestern bin ich ins Kino gegangen.", "hint": "Bewegungsverben bilden das Perfekt mit 'sein'."}, "difficulty": 1300},
]


def seed():
    init_db()
    db = SessionLocal()

    # Prüfen ob bereits Daten vorhanden
    if db.query(Category).count() > 0:
        print("Datenbank bereits befüllt, überspringe Seed.")
        db.close()
        return

    # Kategorien anlegen
    cat_map = {}
    for cat_data in CATEGORIES:
        cat = Category(**cat_data)
        db.add(cat)
        db.flush()
        cat_map[cat_data["slug"]] = cat.id

    # Übungen anlegen
    for ex_data in ARTIKEL_EXERCISES:
        ex = Exercise(
            category_id=cat_map["artikel"],
            exercise_type="multichoice",
            question=ex_data["question"],
            content=ex_data["content"],
            difficulty=ex_data["difficulty"],
            status="active"
        )
        db.add(ex)

    for ex_data in WORTSCHATZ_EXERCISES:
        ex = Exercise(
            category_id=cat_map["wortschatz"],
            exercise_type="multichoice",
            question=ex_data["question"],
            content=ex_data["content"],
            difficulty=ex_data["difficulty"],
            status="active"
        )
        db.add(ex)

    for ex_data in GRAMMATIK_EXERCISES:
        ex = Exercise(
            category_id=cat_map["grammatik"],
            exercise_type="multichoice",
            question=ex_data["question"],
            content=ex_data["content"],
            difficulty=ex_data["difficulty"],
            status="active"
        )
        db.add(ex)

    db.commit()
    db.close()
    print(f"Seed abgeschlossen: {len(ARTIKEL_EXERCISES)} Artikel-, {len(WORTSCHATZ_EXERCISES)} Wortschatz-, {len(GRAMMATIK_EXERCISES)} Grammatik-Übungen angelegt.")


if __name__ == "__main__":
    seed()
