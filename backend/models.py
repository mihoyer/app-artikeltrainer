from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """Anonymer Nutzer – kein Name, keine E-Mail, nur ein Token."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    skill_level = Column(Float, default=1000.0)  # Elo-Startwert
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    progress = relationship("UserProgress", back_populates="user")


class Category(Base):
    """Thematische Kategorie (z.B. Artikel, Grammatik, Wortschatz)."""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(64), unique=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    icon = Column(String(64), default="📚")

    exercises = relationship("Exercise", back_populates="category")


class Exercise(Base):
    """Eine einzelne Übungsaufgabe."""
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    exercise_type = Column(String(32), nullable=False)  # multichoice | dragdrop | vocab
    question = Column(Text, nullable=False)
    # JSON-Feld: enthält Optionen, richtige Antwort, Beispielsatz etc.
    content = Column(JSON, nullable=False)
    difficulty = Column(Float, default=1000.0)  # Elo-Schwierigkeitswert
    status = Column(String(16), default="active")  # active | draft | disabled
    ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="exercises")
    progress = relationship("UserProgress", back_populates="exercise")
    feedback_cache = relationship("AIFeedbackCache", back_populates="exercise")


class UserProgress(Base):
    """Protokolliert jeden Lösungsversuch eines Nutzers."""
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    user_answer = Column(Text, default="")
    skill_before = Column(Float)
    skill_after = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress")
    exercise = relationship("Exercise", back_populates="progress")


class AIFeedbackCache(Base):
    """Gespeicherte KI-Bewertungen – spart API-Kosten bei wiederholten Antworten."""
    __tablename__ = "ai_feedback_cache"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    answer_hash = Column(String(64), index=True)  # SHA256 der Nutzerantwort
    feedback_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    exercise = relationship("Exercise", back_populates="feedback_cache")
