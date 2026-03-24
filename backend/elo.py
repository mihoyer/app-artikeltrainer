"""
Elo-Rating-System für adaptives Lernen.

Sowohl Nutzer als auch Aufgaben haben einen Elo-Wert (Startwert: 1000).
Nach jeder gelösten Aufgabe werden beide Werte angepasst.
"""

K_FACTOR = 32  # Wie stark sich der Wert pro Runde ändern kann


def expected_score(player_rating: float, opponent_rating: float) -> float:
    """Berechnet die erwartete Erfolgswahrscheinlichkeit."""
    return 1.0 / (1.0 + 10 ** ((opponent_rating - player_rating) / 400))


def update_ratings(
    user_rating: float,
    exercise_rating: float,
    is_correct: bool
) -> tuple[float, float]:
    """
    Berechnet neue Elo-Werte für Nutzer und Aufgabe.

    Returns:
        (new_user_rating, new_exercise_rating)
    """
    # Aus Nutzerperspektive: 1 = richtig, 0 = falsch
    user_score = 1.0 if is_correct else 0.0
    # Aus Aufgabenperspektive: umgekehrt
    exercise_score = 1.0 - user_score

    expected_user = expected_score(user_rating, exercise_rating)
    expected_exercise = expected_score(exercise_rating, user_rating)

    new_user_rating = user_rating + K_FACTOR * (user_score - expected_user)
    new_exercise_rating = exercise_rating + K_FACTOR * (exercise_score - expected_exercise)

    # Mindestwert 400, Maximalwert 2000
    new_user_rating = max(400.0, min(2000.0, new_user_rating))
    new_exercise_rating = max(400.0, min(2000.0, new_exercise_rating))

    return round(new_user_rating, 1), round(new_exercise_rating, 1)


def select_exercise_ids(
    user_rating: float,
    available_exercises: list[dict],
    already_seen_ids: list[int],
    count: int = 1
) -> list[int]:
    """
    Wählt Aufgaben aus, deren Schwierigkeit optimal zum Nutzer passt.
    Bevorzugt Aufgaben mit Schwierigkeit nahe dem Nutzer-Elo.
    Vermeidet bereits gesehene Aufgaben.
    """
    # Noch nicht gesehene Aufgaben
    unseen = [ex for ex in available_exercises if ex["id"] not in already_seen_ids]

    # Falls alle gesehen: Reset (Aufgaben wiederholen)
    if not unseen:
        unseen = available_exercises

    # Sortiere nach Nähe zum Nutzer-Elo
    unseen_sorted = sorted(unseen, key=lambda ex: abs(ex["difficulty"] - user_rating))

    # Wähle aus den Top-5 zufällig aus (etwas Variation)
    import random
    pool = unseen_sorted[:min(5, len(unseen_sorted))]
    selected = random.sample(pool, min(count, len(pool)))

    return [ex["id"] for ex in selected]
