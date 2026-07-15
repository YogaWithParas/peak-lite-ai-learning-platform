from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.ai import generate_ai_draft_stub
from core.matching import find_suitable_instructors
from core.models import Instructor, Learner, LearningPlan, MatchRecommendation, Profile

DEMO_PASSWORD = "peaklite-demo-2026"

# Shared vocabulary so the bulk-generated learners/instructors below actually
# overlap with each other -- real candidates for matching, not just noise.
NEEDS_SKILLS_VOCAB = [
    "dyslexia", "adhd", "focus", "organization",
    "number_sense", "working_memory", "reading_fluency",
    "executive_function", "sensory_processing", "written_expression",
]
AVAILABILITY_VOCAB = ["mornings", "afternoons", "evenings", "weekends"]
GRADE_LEVELS = ["K-2", "3-5", "6-8", "9-12"]

# 27 more learners (on top of the 3 named ones below) to reach ~30 total.
EXTRA_LEARNERS = [
    "Noah Kim", "Emma Johnson", "Liam Patel", "Olivia Garcia", "Ethan Brooks",
    "Ava Thompson", "Mason Nguyen", "Sophia Rodriguez", "Lucas Martinez", "Isabella Wright",
    "James Okafor", "Mia Sullivan", "Benjamin Cohen", "Charlotte Diaz", "Elijah Novak",
    "Amelia Fischer", "Henry Alvarez", "Harper Singh", "Daniel Osei", "Grace Delgado",
    "Samuel Reyes", "Victoria Haddad", "Jack Whitfield", "Zoe Meyer", "Leo Petrov",
    "Nora Castillo", "Owen Baptiste",
]

# 17 more instructors (on top of the 3 named ones below) to reach ~20 total.
EXTRA_INSTRUCTORS = [
    "Maria Chen", "Tomas Rivera", "Grace Kim", "David Osei", "Priya Patel",
    "Marcus Yu", "Elena Ruiz", "Samuel Whitfield", "Nadia Hassan", "Connor Blake",
    "Aisha Rahman", "Felix Nakamura", "Sofia Marchetti", "Derek Coleman",
    "Ingrid Larsen", "Malik Johnson", "Renata Alves",
]


class Command(BaseCommand):
    help = "Seed realistic demo learners, instructors, and one full match + AI-draft cycle."

    def handle(self, *args, **options):
        self._user("admin_demo", Profile.ROLE_ADMIN, is_staff=True, is_superuser=True)
        case_manager = self._user("casemanager_demo", Profile.ROLE_CASE_MANAGER)
        family_chen = self._user("family_chen", Profile.ROLE_FAMILY)
        family_rivera = self._user("family_rivera", Profile.ROLE_FAMILY)
        family_anand = self._user("family_anand", Profile.ROLE_FAMILY)

        alex, _ = Learner.objects.get_or_create(
            full_name="Alex Chen",
            defaults=dict(
                grade_level="6-8",
                learning_needs=["dyslexia", "adhd"],
                availability=["mornings", "weekends"],
                family_user=family_chen,
            ),
        )
        Learner.objects.get_or_create(
            full_name="Mateo Rivera",
            defaults=dict(
                grade_level="3-5",
                learning_needs=["focus", "organization"],
                availability=["afternoons"],
                family_user=family_rivera,
            ),
        )
        Learner.objects.get_or_create(
            full_name="Priya Anand",
            defaults=dict(
                grade_level="K-2",
                learning_needs=["number_sense", "working_memory"],
                availability=["mornings"],
                family_user=family_anand,
            ),
        )

        jordan_user = self._user("jordan_lee", Profile.ROLE_INSTRUCTOR)
        Instructor.objects.get_or_create(
            user=jordan_user,
            defaults=dict(
                full_name="Jordan Lee",
                skills=["dyslexia", "adhd"],
                availability=["mornings", "weekends"],
                capacity=3,
                active=True,
            ),
        )

        sam_user = self._user("sam_rivera", Profile.ROLE_INSTRUCTOR)
        Instructor.objects.get_or_create(
            user=sam_user,
            defaults=dict(
                full_name="Sam Rivera",
                skills=["focus", "organization"],
                availability=["afternoons"],
                capacity=2,
                active=True,
            ),
        )

        dana_user = self._user("dana_park", Profile.ROLE_INSTRUCTOR)
        Instructor.objects.get_or_create(
            user=dana_user,
            defaults=dict(
                full_name="Dana Park",
                skills=["number_sense", "working_memory"],
                availability=["mornings"],
                # Full caseload, on purpose -- proves matching correctly
                # excludes zero-capacity instructors even when skills overlap.
                capacity=0,
                active=True,
            ),
        )

        self._seed_bulk_learners()
        self._seed_bulk_instructors()

        # Exercise the real matching + AI-draft logic for one learner, so the
        # seed data isn't static rows -- it proves the actual business logic
        # (core/matching.py, core/ai.py) runs end to end.
        if not MatchRecommendation.objects.filter(learner=alex).exists():
            for instructor, score, reason in find_suitable_instructors(alex):
                MatchRecommendation.objects.create(
                    learner=alex,
                    instructor=instructor,
                    score=score,
                    reason=reason,
                    created_by=case_manager,
                )

        if not LearningPlan.objects.filter(learner=alex).exists():
            LearningPlan.objects.create(
                learner=alex,
                ai_draft=generate_ai_draft_stub(alex),
                created_by=case_manager,
            )

        self.stdout.write(self.style.SUCCESS("\nDemo data seeded. Log in with (same password for all):\n"))
        for label, username in [
            ("admin", "admin_demo"),
            ("case manager", "casemanager_demo"),
            ("instructor", "jordan_lee"),
            ("family", "family_chen"),
        ]:
            self.stdout.write(f"  {label:<13} {username} / {DEMO_PASSWORD}")
        self.stdout.write(
            f"\n{Learner.objects.count()} learners, {Instructor.objects.count()} instructors total.\n"
        )

    def _seed_bulk_learners(self):
        """Plain data rows for volume/realism -- no login account, unlike the 3 named learners above."""
        for i, name in enumerate(EXTRA_LEARNERS):
            Learner.objects.get_or_create(
                full_name=name,
                defaults=dict(
                    grade_level=GRADE_LEVELS[i % len(GRADE_LEVELS)],
                    learning_needs=[
                        NEEDS_SKILLS_VOCAB[i % len(NEEDS_SKILLS_VOCAB)],
                        NEEDS_SKILLS_VOCAB[(i + 3) % len(NEEDS_SKILLS_VOCAB)],
                    ],
                    availability=[AVAILABILITY_VOCAB[i % len(AVAILABILITY_VOCAB)]],
                ),
            )

    def _seed_bulk_instructors(self):
        """Every Instructor needs a User (required OneToOneField), so each still gets an
        account -- but only the 4 named demo accounts are ever surfaced in the login UI."""
        for i, name in enumerate(EXTRA_INSTRUCTORS):
            username = name.lower().replace(" ", "_")
            user = self._user(username, Profile.ROLE_INSTRUCTOR)
            Instructor.objects.get_or_create(
                user=user,
                defaults=dict(
                    full_name=name,
                    skills=[
                        NEEDS_SKILLS_VOCAB[i % len(NEEDS_SKILLS_VOCAB)],
                        NEEDS_SKILLS_VOCAB[(i + 3) % len(NEEDS_SKILLS_VOCAB)],
                    ],
                    availability=[
                        AVAILABILITY_VOCAB[i % len(AVAILABILITY_VOCAB)],
                        AVAILABILITY_VOCAB[(i + 1) % len(AVAILABILITY_VOCAB)],
                    ],
                    # Mostly 1-5 open slots; a couple at 0 for realistic full caseloads.
                    capacity=0 if i % 7 == 6 else (i % 5) + 1,
                    active=True,
                ),
            )

    def _user(self, username, role, is_staff=False, is_superuser=False):
        user, created = User.objects.get_or_create(
            username=username, defaults=dict(is_staff=is_staff, is_superuser=is_superuser)
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
        Profile.objects.get_or_create(user=user, defaults=dict(role=role))
        return user
