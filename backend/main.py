"""
Artikeltrainer.de – Neues Backend
FastAPI + SQLite + Adaptives Elo-System + KI-Feedback-Caching
"""

import os
import secrets
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, init_db
from models import User, Category, Exercise, UserProgress
from elo import update_ratings, select_exercise_ids
from ai_feedback import get_feedback
from seed import seed
from sitemap import generate_sitemap
from fastapi.responses import Response as FastAPIResponse

# ---------------------------------------------------------------------------
# App-Initialisierung
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Artikeltrainer API",
    description="Adaptives Deutschlern-Backend mit KI-Feedback",
    version="1.0.0"
)

# CORS: erlaubt Anfragen vom Frontend (lokal + Subdomain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://neu.artikeltrainer.de",
        "https://www.artikeltrainer.de",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()
    seed()


# ---------------------------------------------------------------------------
# Pydantic-Schemas
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    token: Optional[str] = None


class AnswerSubmit(BaseModel):
    token: str
    exercise_id: int
    user_answer: str


class ExerciseRequest(BaseModel):
    token: str
    category_slug: Optional[str] = None  # None = alle Kategorien


# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------

def get_or_create_user(db: Session, token: str) -> User:
    user = db.query(User).filter(User.token == token).first()
    if not user:
        user = User(token=token, skill_level=1000.0)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.last_seen = datetime.utcnow()
        db.commit()
    return user


# ---------------------------------------------------------------------------
# Endpunkte
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"message": "Artikeltrainer API läuft", "version": "1.0.0"}


@app.get("/sitemap.xml", include_in_schema=False)
def sitemap():
    return FastAPIResponse(content=generate_sitemap(), media_type="application/xml")


@app.get("/robots.txt", include_in_schema=False)
def robots():
    content = """User-agent: *
Allow: /
Disallow: /api/admin/

Sitemap: https://neu.artikeltrainer.de/sitemap.xml
"""
    return FastAPIResponse(content=content, media_type="text/plain")


@app.post("/api/user/init")
def init_user(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Erstellt einen neuen anonymen Nutzer oder gibt einen bestehenden zurück.
    Der Token wird im Browser (localStorage) gespeichert.
    """
    token = payload.token or secrets.token_hex(32)
    user = get_or_create_user(db, token)
    return {
        "token": user.token,
        "skill_level": user.skill_level,
        "is_new": payload.token is None
    }


@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    """Gibt alle verfügbaren Kategorien zurück."""
    cats = db.query(Category).all()
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "name": c.name,
            "description": c.description,
            "icon": c.icon,
            "exercise_count": db.query(Exercise).filter(
                Exercise.category_id == c.id,
                Exercise.status == "active"
            ).count()
        }
        for c in cats
    ]


@app.post("/api/exercise/next")
def get_next_exercise(payload: ExerciseRequest, db: Session = Depends(get_db)):
    """
    Gibt die nächste optimal passende Aufgabe für den Nutzer zurück.
    Berücksichtigt Skill-Level und bereits gesehene Aufgaben.
    """
    user = get_or_create_user(db, payload.token)

    # Bereits gesehene Aufgaben-IDs
    seen_ids = [
        p.exercise_id for p in db.query(UserProgress).filter(
            UserProgress.user_id == user.id
        ).all()
    ]

    # Aufgaben-Query
    query = db.query(Exercise).filter(Exercise.status == "active")
    if payload.category_slug:
        cat = db.query(Category).filter(Category.slug == payload.category_slug).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
        query = query.filter(Exercise.category_id == cat.id)

    exercises = query.all()
    if not exercises:
        raise HTTPException(status_code=404, detail="Keine Aufgaben gefunden")

    # Adaptive Auswahl via Elo
    ex_list = [{"id": ex.id, "difficulty": ex.difficulty} for ex in exercises]
    selected_ids = select_exercise_ids(user.skill_level, ex_list, seen_ids, count=1)

    exercise = db.query(Exercise).filter(Exercise.id == selected_ids[0]).first()
    cat = db.query(Category).filter(Category.id == exercise.category_id).first()

    # Optionen mischen
    import random
    options = exercise.content.get("options", [])
    shuffled_options = options.copy()
    random.shuffle(shuffled_options)

    return {
        "exercise_id": exercise.id,
        "exercise_type": exercise.exercise_type,
        "category": {"slug": cat.slug, "name": cat.name, "icon": cat.icon},
        "question": exercise.question,
        "options": shuffled_options,
        "difficulty": exercise.difficulty,
        "user_skill": user.skill_level,
    }


@app.post("/api/exercise/answer")
def submit_answer(payload: AnswerSubmit, db: Session = Depends(get_db)):
    """
    Verarbeitet eine Nutzerantwort:
    1. Bewertet die Antwort (mit KI-Caching)
    2. Aktualisiert Elo-Werte
    3. Speichert den Fortschritt
    """
    user = get_or_create_user(db, payload.token)
    exercise = db.query(Exercise).filter(Exercise.id == payload.exercise_id).first()

    if not exercise:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")

    correct_answer = exercise.content.get("correct", "")

    # Feedback holen (mit Caching)
    result = get_feedback(db, exercise, payload.user_answer, correct_answer)

    # Elo aktualisieren
    new_user_elo, new_exercise_elo = update_ratings(
        user.skill_level,
        exercise.difficulty,
        result["is_correct"]
    )

    # Fortschritt speichern
    progress = UserProgress(
        user_id=user.id,
        exercise_id=exercise.id,
        is_correct=result["is_correct"],
        user_answer=payload.user_answer,
        skill_before=user.skill_level,
        skill_after=new_user_elo
    )
    db.add(progress)

    # Werte aktualisieren
    user.skill_level = new_user_elo
    exercise.difficulty = new_exercise_elo
    db.commit()

    return {
        "is_correct": result["is_correct"],
        "feedback": result["feedback"],
        "correct_answer": correct_answer,
        "example": exercise.content.get("example", ""),
        "skill_level": new_user_elo,
        "skill_change": round(new_user_elo - progress.skill_before, 1),
        "from_cache": result["from_cache"]
    }


@app.get("/api/user/stats/{token}")
def get_user_stats(token: str, db: Session = Depends(get_db)):
    """Gibt Statistiken für einen anonymen Nutzer zurück."""
    user = db.query(User).filter(User.token == token).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nutzer nicht gefunden")

    total = db.query(UserProgress).filter(UserProgress.user_id == user.id).count()
    correct = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.is_correct == True
    ).count()

    # Streak berechnen (aufeinanderfolgende richtige Antworten)
    recent = db.query(UserProgress).filter(
        UserProgress.user_id == user.id
    ).order_by(UserProgress.timestamp.desc()).limit(50).all()

    streak = 0
    for p in recent:
        if p.is_correct:
            streak += 1
        else:
            break

    return {
        "skill_level": user.skill_level,
        "total_exercises": total,
        "correct_answers": correct,
        "accuracy": round(correct / total * 100, 1) if total > 0 else 0,
        "streak": streak,
        "level_label": _skill_to_label(user.skill_level)
    }


def _skill_to_label(skill: float) -> str:
    if skill < 900:
        return "Einsteiger"
    elif skill < 1050:
        return "Grundkenntnisse"
    elif skill < 1150:
        return "Mittelstufe"
    elif skill < 1300:
        return "Fortgeschritten"
    else:
        return "Experte"


# ---------------------------------------------------------------------------
# Admin-Endpunkte (einfacher Schutz via API-Key)
# ---------------------------------------------------------------------------

ADMIN_KEY = os.getenv("ADMIN_API_KEY", "changeme-admin-key")


@app.get("/api/admin/drafts")
def get_draft_exercises(api_key: str, db: Session = Depends(get_db)):
    """Gibt alle Aufgaben im Draft-Status zurück (zur Freigabe)."""
    if api_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")
    drafts = db.query(Exercise).filter(Exercise.status == "draft").all()
    return [
        {
            "id": ex.id,
            "question": ex.question,
            "content": ex.content,
            "exercise_type": ex.exercise_type,
            "difficulty": ex.difficulty,
            "ai_generated": ex.ai_generated,
            "created_at": ex.created_at.isoformat()
        }
        for ex in drafts
    ]


@app.post("/api/admin/approve/{exercise_id}")
def approve_exercise(exercise_id: int, api_key: str, db: Session = Depends(get_db)):
    """Gibt eine Draft-Aufgabe frei."""
    if api_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    ex.status = "active"
    db.commit()
    return {"message": f"Aufgabe {exercise_id} freigegeben"}
