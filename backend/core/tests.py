from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from .models import Instructor, Learner, LearningPlan, MatchRecommendation, Profile


class BaseSetup(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(username="admin1", password="pass12345")
        Profile.objects.create(user=self.admin_user, role=Profile.ROLE_ADMIN)

        self.case_manager = User.objects.create_user(username="cm1", password="pass12345")
        Profile.objects.create(user=self.case_manager, role=Profile.ROLE_CASE_MANAGER)

        self.family_user = User.objects.create_user(username="family1", password="pass12345")
        Profile.objects.create(user=self.family_user, role=Profile.ROLE_FAMILY)

        self.instructor_user = User.objects.create_user(username="instr1", password="pass12345")
        Profile.objects.create(user=self.instructor_user, role=Profile.ROLE_INSTRUCTOR)

        self.other_instructor_user = User.objects.create_user(username="instr2", password="pass12345")
        Profile.objects.create(user=self.other_instructor_user, role=Profile.ROLE_INSTRUCTOR)

        self.learner = Learner.objects.create(
            full_name="Alex Chen",
            grade_level="6-8",
            learning_needs=["dyslexia", "adhd"],
            availability=["mornings"],
            family_user=self.family_user,
        )

        # Suitable: active, capacity > 0, skills overlap with the learner's needs.
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            full_name="Jordan Lee",
            skills=["dyslexia", "adhd"],
            availability=["mornings"],
            capacity=3,
            active=True,
        )

        # Skills overlap but capacity is 0 -> must be excluded from matching.
        self.full_instructor = Instructor.objects.create(
            user=self.other_instructor_user,
            full_name="Sam Rivera",
            skills=["dyslexia"],
            availability=["mornings"],
            capacity=0,
            active=True,
        )


class MatchRecommendationTests(BaseSetup):
    def test_case_manager_can_create_match_recommendations(self):
        self.client.force_authenticate(self.case_manager)
        response = self.client.post(
            "/api/match-recommendations/", {"learner_id": self.learner.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["learner"], "Alex Chen")
        self.assertEqual(len(response.data["recommendations"]), 1)
        self.assertEqual(response.data["recommendations"][0]["instructor"], "Jordan Lee")
        self.assertEqual(response.data["recommendations"][0]["status"], "pending")

    def test_instructor_cannot_create_match_recommendations(self):
        self.client.force_authenticate(self.instructor_user)
        response = self.client.post(
            "/api/match-recommendations/", {"learner_id": self.learner.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(MatchRecommendation.objects.count(), 0)

    def test_recommendations_exclude_inactive_or_zero_capacity_instructors(self):
        self.client.force_authenticate(self.case_manager)
        response = self.client.post(
            "/api/match-recommendations/", {"learner_id": self.learner.id}, format="json"
        )

        instructor_names = [r["instructor"] for r in response.data["recommendations"]]
        self.assertNotIn("Sam Rivera", instructor_names)  # capacity is 0

    def test_case_manager_can_approve_match_recommendation(self):
        recommendation = MatchRecommendation.objects.create(
            learner=self.learner,
            instructor=self.instructor,
            score=85,
            reason="test",
            created_by=self.case_manager,
        )

        self.client.force_authenticate(self.case_manager)
        response = self.client.post(f"/api/match-recommendations/{recommendation.id}/approve/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        recommendation.refresh_from_db()
        self.assertEqual(recommendation.status, MatchRecommendation.STATUS_APPROVED)
        self.assertEqual(recommendation.reviewed_by, self.case_manager)
        self.assertIsNotNone(recommendation.reviewed_at)

    def test_instructor_can_only_view_their_own_recommendations(self):
        own_recommendation = MatchRecommendation.objects.create(
            learner=self.learner,
            instructor=self.instructor,
            score=85,
            reason="test",
            created_by=self.case_manager,
        )
        other_learner = Learner.objects.create(
            full_name="Other Kid", grade_level="K-2", learning_needs=[], availability=[]
        )
        other_recommendation = MatchRecommendation.objects.create(
            learner=other_learner,
            instructor=self.full_instructor,
            score=50,
            reason="test2",
            created_by=self.case_manager,
        )

        self.client.force_authenticate(self.instructor_user)
        response = self.client.get("/api/match-recommendations/")

        ids = [r["id"] for r in response.data["results"]]
        self.assertIn(own_recommendation.id, ids)
        self.assertNotIn(other_recommendation.id, ids)


class LearningPlanTests(BaseSetup):
    def setUp(self):
        super().setUp()
        self.plan = LearningPlan.objects.create(
            learner=self.learner,
            ai_draft="AI generated draft text",
            created_by=self.case_manager,
        )

    def test_case_manager_can_create_learning_plan(self):
        self.client.force_authenticate(self.case_manager)
        response = self.client.post(
            "/api/learning-plans/", {"learner_id": self.learner.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "draft")
        self.assertTrue(response.data["ai_draft"])  # a stub draft was generated
        self.assertIsNone(response.data["approved_plan"])

    def test_case_manager_can_approve_learning_plan(self):
        self.client.force_authenticate(self.case_manager)
        response = self.client.post(f"/api/learning-plans/{self.plan.id}/approve/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plan.refresh_from_db()
        self.assertEqual(self.plan.status, LearningPlan.STATUS_APPROVED)
        self.assertEqual(self.plan.approved_by, self.case_manager)
        self.assertIsNotNone(self.plan.approved_at)
        self.assertEqual(self.plan.approved_plan, "AI generated draft text")

    def test_family_cannot_approve_learning_plan(self):
        self.client.force_authenticate(self.family_user)
        response = self.client.post(f"/api/learning-plans/{self.plan.id}/approve/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.plan.refresh_from_db()
        self.assertEqual(self.plan.status, LearningPlan.STATUS_DRAFT)


class MeEndpointTests(BaseSetup):
    def test_me_returns_username_and_role(self):
        self.client.force_authenticate(self.instructor_user)
        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "instr1")
        self.assertEqual(response.data["role"], Profile.ROLE_INSTRUCTOR)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HardeningTests(BaseSetup):
    def test_learner_list_is_paginated(self):
        self.client.force_authenticate(self.case_manager)
        response = self.client.get("/api/learners/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
        self.assertEqual(response.data["count"], Learner.objects.count())

    def test_match_recommendation_creation_is_throttled(self):
        # ScopedRateThrottle.THROTTLE_RATES is bound from settings once at import
        # time, so override_settings() alone won't lower it for this test --
        # patch the class attribute directly instead, and restore it after.
        cache.clear()
        original_rates = ScopedRateThrottle.THROTTLE_RATES
        ScopedRateThrottle.THROTTLE_RATES = {**original_rates, "match_recommendations": "1/min"}
        try:
            self.client.force_authenticate(self.case_manager)
            first = self.client.post(
                "/api/match-recommendations/", {"learner_id": self.learner.id}, format="json"
            )
            second = self.client.post(
                "/api/match-recommendations/", {"learner_id": self.learner.id}, format="json"
            )
        finally:
            ScopedRateThrottle.THROTTLE_RATES = original_rates

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
