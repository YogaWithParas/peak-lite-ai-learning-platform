"""Simple, explainable rule-based instructor matching.

Mirrors the frontend's lib/matching.ts: pure scoring logic kept separate
from views/serializers so it's easy to test and reason about on its own.
"""

from .models import Instructor

MAX_SKILL_SCORE = 60
MAX_AVAILABILITY_SCORE = 20
MAX_CAPACITY_SCORE = 20
CAPACITY_SCORE_PER_SLOT = 4
DEFAULT_RESULT_LIMIT = 3


def score_breakdown(learner, instructor):
    """Return the 3 real, explainable sub-scores for a learner/instructor pair.

    Each sub-score is derived entirely from fields that actually exist on the
    models (learning_needs/skills/availability/capacity) -- no invented
    criteria. It's a pure function of current data, so callers recompute it
    on demand (e.g. a serializer method field) rather than storing it.
    """
    needs = set(learner.learning_needs or [])
    learner_availability = set(learner.availability or [])
    shared_skills = needs & set(instructor.skills or [])
    shared_availability = learner_availability & set(instructor.availability or [])

    skill_score = round(MAX_SKILL_SCORE * len(shared_skills) / len(needs)) if needs else 0
    availability_score = (
        round(MAX_AVAILABILITY_SCORE * len(shared_availability) / len(learner_availability))
        if learner_availability
        else 0
    )
    capacity_score = min(MAX_CAPACITY_SCORE, instructor.capacity * CAPACITY_SCORE_PER_SLOT)

    return {
        "skill_score": skill_score,
        "availability_score": availability_score,
        "capacity_score": capacity_score,
        "shared_skills": shared_skills,
        "shared_availability": shared_availability,
    }


def find_suitable_instructors(learner, limit=DEFAULT_RESULT_LIMIT):
    """Return up to `limit` (instructor, score, reason) tuples, best first.

    Rules:
    - instructor must be active
    - instructor must have capacity > 0
    - instructor skills must overlap with the learner's learning_needs
    """
    results = []

    candidates = Instructor.objects.filter(active=True, capacity__gt=0)
    for instructor in candidates:
        breakdown = score_breakdown(learner, instructor)
        if not breakdown["shared_skills"]:
            continue

        score = breakdown["skill_score"] + breakdown["availability_score"] + breakdown["capacity_score"]
        reason = _build_reason(breakdown["shared_skills"], breakdown["shared_availability"], instructor.capacity)
        results.append((instructor, score, reason))

    results.sort(key=lambda item: item[1], reverse=True)
    return results[:limit]


def _build_reason(shared_skills, shared_availability, capacity):
    skills_text = ", ".join(sorted(shared_skills))
    reason = f"Instructor has {skills_text} support skills and available capacity ({capacity} slots)."
    if shared_availability:
        reason += f" Also available during {', '.join(sorted(shared_availability))}."
    return reason
