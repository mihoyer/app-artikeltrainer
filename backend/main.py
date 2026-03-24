"""
Artikeltrainer.de – Neues Backend
FastAPI + SQLite + Adaptives Elo-System + KI-Feedback-Caching
"""

import os
import secrets
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, init_db
from models import User, Category, Exercise, UserProgress, AIFeedbackCache
from elo import update_ratings, select_exercise_ids
from ai_feedback import get_feedback
from seed import seed
from sitemap import generate_sitemap
from ai_generate import generate_exercises
from fastapi.responses import Response as FastAPIResponse

# ---------------------------------------------------------------------------
# App-Initialisierung
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Artikeltrainer API",
    description="Adaptives Deutschlern-Backend mit KI-Feedback",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://neu.artikeltrainer.de",
        "https://app.artikeltrainer.de",
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
    token: Optional[str] = None
    category_slug: Optional[str] = None


class ExerciseCreate(BaseModel):
    category_id: int
    exercise_type: str
    question: str
    content: dict
    difficulty: Optional[float] = 1000.0
    status: Optional[str] = "draft"


class ExerciseUpdate(BaseModel):
    category_id: Optional[int] = None
    exercise_type: Optional[str] = None
    question: Optional[str] = None
    content: Optional[dict] = None
    difficulty: Optional[float] = None
    status: Optional[str] = None


class CategoryCreate(BaseModel):
    slug: str
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "📚"


class GenerateRequest(BaseModel):
    category_id: int
    count: Optional[int] = 5


# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------

ADMIN_KEY = os.getenv("ADMIN_API_KEY", "changeme-admin-key")


def require_admin(x_admin_key: Optional[str] = Header(None)):
    """Dependency: prüft den Admin-API-Key im Header."""
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")
    return x_admin_key


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
# Öffentliche Endpunkte
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

Sitemap: https://app.artikeltrainer.de/sitemap.xml
"""
    return FastAPIResponse(content=content, media_type="text/plain")


@app.post("/api/user/init")
def init_user(payload: UserCreate, db: Session = Depends(get_db)):
    token = payload.token or secrets.token_hex(32)
    user = get_or_create_user(db, token)
    return {
        "token": user.token,
        "skill_level": user.skill_level,
        "is_new": payload.token is None
    }


@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
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
    token = payload.token or secrets.token_hex(32)
    user = get_or_create_user(db, token)

    seen_ids = [
        p.exercise_id for p in db.query(UserProgress).filter(
            UserProgress.user_id == user.id
        ).all()
    ]

    query = db.query(Exercise).filter(Exercise.status == "active")
    if payload.category_slug:
        cat = db.query(Category).filter(Category.slug == payload.category_slug).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
        query = query.filter(Exercise.category_id == cat.id)

    exercises = query.all()
    if not exercises:
        raise HTTPException(status_code=404, detail="Keine Aufgaben gefunden")

    ex_list = [{"id": ex.id, "difficulty": ex.difficulty} for ex in exercises]
    selected_ids = select_exercise_ids(user.skill_level, ex_list, seen_ids, count=1)

    exercise = db.query(Exercise).filter(Exercise.id == selected_ids[0]).first()
    cat = db.query(Category).filter(Category.id == exercise.category_id).first()

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
    user = get_or_create_user(db, payload.token)
    exercise = db.query(Exercise).filter(Exercise.id == payload.exercise_id).first()

    if not exercise:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")

    correct_answer = exercise.content.get("correct", "")
    result = get_feedback(db, exercise, payload.user_answer, correct_answer)

    new_user_elo, new_exercise_elo = update_ratings(
        user.skill_level,
        exercise.difficulty,
        result["is_correct"]
    )

    progress = UserProgress(
        user_id=user.id,
        exercise_id=exercise.id,
        is_correct=result["is_correct"],
        user_answer=payload.user_answer,
        skill_before=user.skill_level,
        skill_after=new_user_elo
    )
    db.add(progress)

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
    user = db.query(User).filter(User.token == token).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nutzer nicht gefunden")

    total = db.query(UserProgress).filter(UserProgress.user_id == user.id).count()
    correct = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.is_correct == True
    ).count()

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


# ---------------------------------------------------------------------------
# Admin-Endpunkte
# ---------------------------------------------------------------------------

@app.get("/api/admin/stats")
def admin_stats(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    """Dashboard-Statistiken."""
    total_users = db.query(User).count()
    total_exercises = db.query(Exercise).count()
    active_exercises = db.query(Exercise).filter(Exercise.status == "active").count()
    draft_exercises = db.query(Exercise).filter(Exercise.status == "draft").count()
    disabled_exercises = db.query(Exercise).filter(Exercise.status == "disabled").count()
    total_answers = db.query(UserProgress).count()
    correct_answers = db.query(UserProgress).filter(UserProgress.is_correct == True).count()
    cache_entries = db.query(AIFeedbackCache).count()
    ai_generated = db.query(Exercise).filter(Exercise.ai_generated == True).count()

    return {
        "users": {
            "total": total_users,
        },
        "exercises": {
            "total": total_exercises,
            "active": active_exercises,
            "draft": draft_exercises,
            "disabled": disabled_exercises,
            "ai_generated": ai_generated,
        },
        "answers": {
            "total": total_answers,
            "correct": correct_answers,
            "accuracy": round(correct_answers / total_answers * 100, 1) if total_answers > 0 else 0,
        },
        "cache": {
            "entries": cache_entries,
        }
    }


@app.get("/api/admin/exercises")
def admin_get_exercises(
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Alle Aufgaben mit optionalem Filter nach Status und Kategorie."""
    query = db.query(Exercise)
    if status:
        query = query.filter(Exercise.status == status)
    if category_id:
        query = query.filter(Exercise.category_id == category_id)
    exercises = query.order_by(Exercise.created_at.desc()).all()

    result = []
    for ex in exercises:
        cat = db.query(Category).filter(Category.id == ex.category_id).first()
        answer_count = db.query(UserProgress).filter(UserProgress.exercise_id == ex.id).count()
        result.append({
            "id": ex.id,
            "question": ex.question,
            "content": ex.content,
            "exercise_type": ex.exercise_type,
            "difficulty": round(ex.difficulty, 1),
            "status": ex.status,
            "ai_generated": ex.ai_generated,
            "category": {"id": cat.id, "name": cat.name, "slug": cat.slug, "icon": cat.icon} if cat else None,
            "answer_count": answer_count,
            "created_at": ex.created_at.isoformat()
        })
    return result


@app.get("/api/admin/exercises/{exercise_id}")
def admin_get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Einzelne Aufgabe mit Details."""
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    cat = db.query(Category).filter(Category.id == ex.category_id).first()
    cache_entries = db.query(AIFeedbackCache).filter(AIFeedbackCache.exercise_id == ex.id).all()
    return {
        "id": ex.id,
        "question": ex.question,
        "content": ex.content,
        "exercise_type": ex.exercise_type,
        "difficulty": round(ex.difficulty, 1),
        "status": ex.status,
        "ai_generated": ex.ai_generated,
        "category": {"id": cat.id, "name": cat.name, "slug": cat.slug} if cat else None,
        "created_at": ex.created_at.isoformat(),
        "feedback_cache": [
            {"answer_hash": c.answer_hash[:8] + "...", "feedback": c.feedback_text, "is_correct": c.is_correct}
            for c in cache_entries
        ]
    }


@app.post("/api/admin/exercises")
def admin_create_exercise(
    payload: ExerciseCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Neue Aufgabe anlegen."""
    cat = db.query(Category).filter(Category.id == payload.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
    ex = Exercise(
        category_id=payload.category_id,
        exercise_type=payload.exercise_type,
        question=payload.question,
        content=payload.content,
        difficulty=payload.difficulty,
        status=payload.status,
        ai_generated=False
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return {"id": ex.id, "message": "Aufgabe angelegt", "status": ex.status}


@app.put("/api/admin/exercises/{exercise_id}")
def admin_update_exercise(
    exercise_id: int,
    payload: ExerciseUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Aufgabe bearbeiten."""
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    if payload.category_id is not None:
        ex.category_id = payload.category_id
    if payload.exercise_type is not None:
        ex.exercise_type = payload.exercise_type
    if payload.question is not None:
        ex.question = payload.question
    if payload.content is not None:
        ex.content = payload.content
    if payload.difficulty is not None:
        ex.difficulty = payload.difficulty
    if payload.status is not None:
        ex.status = payload.status
    db.commit()
    return {"message": f"Aufgabe {exercise_id} aktualisiert"}


@app.post("/api/admin/exercises/{exercise_id}/approve")
def admin_approve_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Draft-Aufgabe freigeben."""
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    ex.status = "active"
    db.commit()
    return {"message": f"Aufgabe {exercise_id} freigegeben"}


@app.post("/api/admin/exercises/{exercise_id}/disable")
def admin_disable_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Aufgabe deaktivieren."""
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    ex.status = "disabled"
    db.commit()
    return {"message": f"Aufgabe {exercise_id} deaktiviert"}


@app.delete("/api/admin/exercises/{exercise_id}")
def admin_delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Aufgabe löschen (inkl. Cache und Fortschritt)."""
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    db.query(AIFeedbackCache).filter(AIFeedbackCache.exercise_id == exercise_id).delete()
    db.query(UserProgress).filter(UserProgress.exercise_id == exercise_id).delete()
    db.delete(ex)
    db.commit()
    return {"message": f"Aufgabe {exercise_id} gelöscht"}


@app.get("/api/admin/categories")
def admin_get_categories(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Alle Kategorien mit Aufgabenzahlen."""
    cats = db.query(Category).all()
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "name": c.name,
            "description": c.description,
            "icon": c.icon,
            "active_count": db.query(Exercise).filter(Exercise.category_id == c.id, Exercise.status == "active").count(),
            "draft_count": db.query(Exercise).filter(Exercise.category_id == c.id, Exercise.status == "draft").count(),
            "total_count": db.query(Exercise).filter(Exercise.category_id == c.id).count(),
        }
        for c in cats
    ]


@app.post("/api/admin/categories")
def admin_create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Neue Kategorie anlegen."""
    existing = db.query(Category).filter(Category.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug bereits vorhanden")
    cat = Category(slug=payload.slug, name=payload.name, description=payload.description, icon=payload.icon)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "message": "Kategorie angelegt"}


@app.get("/api/admin/cache")
def admin_get_cache(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """KI-Feedback-Cache anzeigen."""
    entries = db.query(AIFeedbackCache).order_by(AIFeedbackCache.created_at.desc()).limit(100).all()
    return [
        {
            "id": e.id,
            "exercise_id": e.exercise_id,
            "feedback": e.feedback_text,
            "is_correct": e.is_correct,
            "created_at": e.created_at.isoformat()
        }
        for e in entries
    ]


@app.delete("/api/admin/cache")
def admin_clear_cache(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Gesamten KI-Cache leeren."""
    count = db.query(AIFeedbackCache).count()
    db.query(AIFeedbackCache).delete()
    db.commit()
    return {"message": f"{count} Cache-Einträge gelöscht"}


@app.get("/api/admin/users")
def admin_get_users(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """Anonyme Nutzer-Übersicht (kein Name, nur Token-Prefix und Stats)."""
    users = db.query(User).order_by(User.last_seen.desc()).limit(200).all()
    result = []
    for u in users:
        total = db.query(UserProgress).filter(UserProgress.user_id == u.id).count()
        correct = db.query(UserProgress).filter(UserProgress.user_id == u.id, UserProgress.is_correct == True).count()
        result.append({
            "id": u.id,
            "token_prefix": u.token[:8] + "...",
            "skill_level": round(u.skill_level, 1),
            "level_label": _skill_to_label(u.skill_level),
            "total_answers": total,
            "correct_answers": correct,
            "accuracy": round(correct / total * 100, 1) if total > 0 else 0,
            "created_at": u.created_at.isoformat(),
            "last_seen": u.last_seen.isoformat()
        })
    return result


# ---------------------------------------------------------------------------
# KI-Aufgabengenerierung
# ---------------------------------------------------------------------------

@app.post("/api/admin/generate")
def admin_generate_exercises(
    payload: GenerateRequest,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin)
):
    """
    Generiert neue Übungsaufgaben via KI.
    Alle generierten Aufgaben landen im Status 'draft'.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY nicht konfiguriert")

    count = max(1, min(payload.count or 5, 20))  # Maximal 20 auf einmal

    # Kategorie laden
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")

    # Bestehende Fragen laden (Duplikat-Vermeidung)
    existing_questions = [
        ex.question for ex in
        db.query(Exercise).filter(Exercise.category_id == payload.category_id).all()
    ]

    try:
        generated = generate_exercises(
            category_slug=category.slug,
            category_name=category.name,
            count=count,
            existing_questions=existing_questions
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Fehler bei KI-Generierung: {e}")
        raise HTTPException(status_code=500, detail=f"KI-Fehler: {str(e)}")

    # In Datenbank speichern (Status: draft)
    saved = []
    for ex_data in generated:
        content = {
            "options": ex_data["options"],
            "correct_answer": ex_data["correct_answer"],
            "hint": ex_data["hint"],
            "example": ex_data["example"]
        }
        exercise = Exercise(
            category_id=payload.category_id,
            exercise_type="multichoice",
            question=ex_data["question"],
            content=content,
            difficulty=ex_data["difficulty"],
            status="draft",
            ai_generated=True
        )
        db.add(exercise)
        db.commit()
        db.refresh(exercise)
        saved.append({
            "id": exercise.id,
            "question": exercise.question,
            "correct_answer": content["correct_answer"],
            "difficulty": exercise.difficulty
        })

    return {
        "generated": len(saved),
        "exercises": saved,
        "message": f"{len(saved)} Aufgaben als Entwurf gespeichert – bitte im Admin-Bereich prüfen und freigeben."
    }


# Rückwärtskompatibilität: alter Endpunkt
@app.get("/api/admin/drafts")
def get_draft_exercises(api_key: str, db: Session = Depends(get_db)):
    if api_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")
    drafts = db.query(Exercise).filter(Exercise.status == "draft").all()
    return [{"id": ex.id, "question": ex.question, "content": ex.content,
             "exercise_type": ex.exercise_type, "difficulty": ex.difficulty,
             "ai_generated": ex.ai_generated, "created_at": ex.created_at.isoformat()}
            for ex in drafts]
