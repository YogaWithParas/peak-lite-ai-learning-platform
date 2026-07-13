from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.ai import generate_ai_draft_stub
from core.matching import find_suitable_instructors
from core.models import Instructor, Learner, LearningPlan, MatchRecommendation, Profile

DEMO_PASSWORD = "peaklite-demo-2026"


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
        self.stdout.write("")

    def _user(self, username, role, is_staff=False, is_superuser=False):
        user, created = User.objects.get_or_create(
            username=username, defaults=dict(is_staff=is_staff, is_superuser=is_superuser)
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
        Profile.objects.get_or_create(user=user, defaults=dict(role=role))
        return user
