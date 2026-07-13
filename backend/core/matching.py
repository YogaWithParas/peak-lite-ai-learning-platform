"""Simple, explainable rule-based instructor matching.

Mirrors the frontend's lib/matching.ts: pure scoring logic kept separate
from views/serializers so it's easy to test and reason about on its own.
"""

from .models import Instructor

BASE_SCORE = 40
POINTS_PER_SHARED_SKILL = 20
POINTS_PER_SHARED_AVAILABILITY = 5
MAX_SCORE = 100
DEFAULT_RESULT_LIMIT = 3


def find_suitable_instructors(learner, limit=DEFAULT_RESULT_LIMIT):
    """Return up to `limit` (instructor, score, reason) tuples, best first.

    Rules:
    - instructor must be active
    - instructor must have capacity > 0
    - instructor skills must overlap with the learner's learning_needs
    - shared availability slots add a small bonus to the score
    """
    needs = set(learner.learning_needs or [])
    results = []

    candidates = Instructor.objects.filter(active=True, capacity__gt=0)
    for instructor in candidates:
        shared_skills = needs & set(instructor.skills or [])
        if not shared_skills:
            continue

        shared_availability = set(learner.availability or []) & set(instructor.availability or [])
        score = min(
            BASE_SCORE
            + len(shared_skills) * POINTS_PER_SHARED_SKILL
            + len(shared_availability) * POINTS_PER_SHARED_AVAILABILITY,
            MAX_SCORE,
        )
        reason = _build_reason(shared_skills, shared_availability, instructor.capacity)
        results.append((instructor, score, reason))

    results.sort(key=lambda item: item[1], reverse=True)
    return results[:limit]


def _build_reason(shared_skills, shared_availability, capacity):
    skills_text = ", ".join(sorted(shared_skills))
    reason = f"Instructor has {skills_text} support skills and available capacity ({capacity} slots)."
    if shared_availability:
        reason += f" Also available during {', '.join(sorted(shared_availability))}."
    return reason
