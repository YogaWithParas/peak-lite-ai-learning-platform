from django.contrib.auth.models import User
from rest_framework import serializers

from .matching import score_breakdown as compute_score_breakdown
from .models import Instructor, Learner, LearningPlan, MatchRecommendation, Profile


def _score_breakdown_payload(match_recommendation):
    breakdown = compute_score_breakdown(match_recommendation.learner, match_recommendation.instructor)
    return {
        "skill_score": breakdown["skill_score"],
        "availability_score": breakdown["availability_score"],
        "capacity_score": breakdown["capacity_score"],
    }


class UserMiniSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role", read_only=True, default=None)

    class Meta:
        model = User
        fields = ["id", "username", "role"]


class LearnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Learner
        fields = [
            "id",
            "full_name",
            "grade_level",
            "learning_needs",
            "availability",
            "family_user",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instructor
        fields = [
            "id",
            "user",
            "full_name",
            "skills",
            "availability",
            "capacity",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MatchRecommendationSerializer(serializers.ModelSerializer):
    learner_name = serializers.CharField(source="learner.full_name", read_only=True)
    instructor_name = serializers.CharField(source="instructor.full_name", read_only=True)
    score_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = MatchRecommendation
        fields = [
            "id",
            "learner",
            "learner_name",
            "instructor",
            "instructor_name",
            "score",
            "score_breakdown",
            "reason",
            "status",
            "created_by",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "score",
            "reason",
            "created_by",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]

    def get_score_breakdown(self, obj):
        return _score_breakdown_payload(obj)


class MatchRecommendationResultSerializer(serializers.ModelSerializer):
    """Compact shape used in the POST /api/match-recommendations/ response."""

    instructor = serializers.CharField(source="instructor.full_name", read_only=True)
    score_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = MatchRecommendation
        fields = ["id", "instructor", "score", "score_breakdown", "reason", "status"]

    def get_score_breakdown(self, obj):
        return _score_breakdown_payload(obj)


class LearningPlanSerializer(serializers.ModelSerializer):
    learner_name = serializers.CharField(source="learner.full_name", read_only=True)

    class Meta:
        model = LearningPlan
        fields = [
            "id",
            "learner",
            "learner_name",
            "ai_draft",
            "approved_plan",
            "status",
            "created_by",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_by",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]
