from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .ai import generate_ai_draft_stub
from .matching import find_suitable_instructors
from .models import Instructor, Learner, LearningPlan, MatchRecommendation, Profile, get_role
from .permissions import IsAdminOrCaseManager
from .serializers import (
    InstructorSerializer,
    LearnerSerializer,
    LearningPlanSerializer,
    MatchRecommendationResultSerializer,
    MatchRecommendationSerializer,
)


class ThrottledObtainAuthToken(ObtainAuthToken):
    """Same login behavior as DRF's default, rate-limited to blunt brute-force attempts."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class LearnerViewSet(viewsets.ModelViewSet):
    queryset = Learner.objects.all()
    serializer_class = LearnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrCaseManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        role = get_role(self.request.user)
        qs = super().get_queryset()
        if role in (Profile.ROLE_ADMIN, Profile.ROLE_CASE_MANAGER):
            return qs
        if role == Profile.ROLE_FAMILY:
            return qs.filter(family_user=self.request.user)
        if role == Profile.ROLE_INSTRUCTOR:
            return qs.filter(match_recommendations__instructor__user=self.request.user).distinct()
        return qs.none()


class InstructorViewSet(viewsets.ModelViewSet):
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrCaseManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        role = get_role(self.request.user)
        qs = super().get_queryset()
        if role in (Profile.ROLE_ADMIN, Profile.ROLE_CASE_MANAGER):
            return qs
        if role == Profile.ROLE_INSTRUCTOR:
            return qs.filter(user=self.request.user)
        if role == Profile.ROLE_FAMILY:
            return qs.filter(match_recommendations__learner__family_user=self.request.user).distinct()
        return qs.none()


class MatchRecommendationViewSet(viewsets.ModelViewSet):
    queryset = MatchRecommendation.objects.select_related("learner", "instructor").all()
    serializer_class = MatchRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "approve", "reject"):
            return [IsAdminOrCaseManager()]
        return [permissions.IsAuthenticated()]

    def get_throttles(self):
        if self.action == "create":
            self.throttle_scope = "match_recommendations"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        role = get_role(self.request.user)
        qs = super().get_queryset()
        if role in (Profile.ROLE_ADMIN, Profile.ROLE_CASE_MANAGER):
            return qs
        if role == Profile.ROLE_INSTRUCTOR:
            return qs.filter(instructor__user=self.request.user)
        if role == Profile.ROLE_FAMILY:
            return qs.filter(learner__family_user=self.request.user)
        return qs.none()

    def create(self, request, *args, **kwargs):
        learner_id = request.data.get("learner_id")
        if not learner_id:
            return Response({"detail": "learner_id is required."}, status=400)
        learner = get_object_or_404(Learner, pk=learner_id)

        suitable = find_suitable_instructors(learner)
        recommendations = [
            MatchRecommendation.objects.create(
                learner=learner,
                instructor=instructor,
                score=score,
                reason=reason,
                created_by=request.user,
            )
            for instructor, score, reason in suitable
        ]

        return Response(
            {
                "learner": learner.full_name,
                "recommendations": MatchRecommendationResultSerializer(recommendations, many=True).data,
            },
            status=201,
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        recommendation = self.get_object()
        recommendation.status = MatchRecommendation.STATUS_APPROVED
        recommendation.reviewed_by = request.user
        recommendation.reviewed_at = timezone.now()
        recommendation.save()
        return Response(MatchRecommendationSerializer(recommendation).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        recommendation = self.get_object()
        recommendation.status = MatchRecommendation.STATUS_REJECTED
        recommendation.reviewed_by = request.user
        recommendation.reviewed_at = timezone.now()
        recommendation.save()
        return Response(MatchRecommendationSerializer(recommendation).data)


class LearningPlanViewSet(viewsets.ModelViewSet):
    queryset = LearningPlan.objects.select_related("learner").all()
    serializer_class = LearningPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "approve", "reject"):
            return [IsAdminOrCaseManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        role = get_role(self.request.user)
        qs = super().get_queryset()
        if role in (Profile.ROLE_ADMIN, Profile.ROLE_CASE_MANAGER):
            return qs
        if role == Profile.ROLE_FAMILY:
            return qs.filter(learner__family_user=self.request.user)
        if role == Profile.ROLE_INSTRUCTOR:
            return qs.filter(learner__match_recommendations__instructor__user=self.request.user).distinct()
        return qs.none()

    def create(self, request, *args, **kwargs):
        learner_id = request.data.get("learner_id")
        if not learner_id:
            return Response({"detail": "learner_id is required."}, status=400)
        learner = get_object_or_404(Learner, pk=learner_id)

        ai_draft = request.data.get("ai_draft") or generate_ai_draft_stub(learner)
        plan = LearningPlan.objects.create(learner=learner, ai_draft=ai_draft, created_by=request.user)
        return Response(LearningPlanSerializer(plan).data, status=201)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        plan = self.get_object()
        plan.approved_plan = request.data.get("approved_plan") or plan.ai_draft
        plan.status = LearningPlan.STATUS_APPROVED
        plan.approved_by = request.user
        plan.approved_at = timezone.now()
        plan.save()
        return Response(LearningPlanSerializer(plan).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        plan = self.get_object()
        plan.status = LearningPlan.STATUS_REJECTED
        plan.save()
        return Response(LearningPlanSerializer(plan).data)
