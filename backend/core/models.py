from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    """Assigns a PEAK-Lite role to a Django User. Kept as a separate model
    (rather than extending User) so auth stays on Django's built-in system."""

    ROLE_ADMIN = "admin"
    ROLE_CASE_MANAGER = "case_manager"
    ROLE_INSTRUCTOR = "instructor"
    ROLE_FAMILY = "family"
    ROLE_CHOICES = [
        (ROLE_ADMIN, "Admin"),
        (ROLE_CASE_MANAGER, "Case Manager"),
        (ROLE_INSTRUCTOR, "Instructor"),
        (ROLE_FAMILY, "Family"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_FAMILY)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


def get_role(user):
    """Superusers are always treated as admin, otherwise defer to Profile.role."""
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return Profile.ROLE_ADMIN
    profile = getattr(user, "profile", None)
    return profile.role if profile else None


class Learner(models.Model):
    full_name = models.CharField(max_length=255)
    grade_level = models.CharField(max_length=50)
    learning_needs = models.JSONField(default=list, blank=True)
    availability = models.JSONField(default=list, blank=True)
    family_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="learners"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class Instructor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="instructor_profile")
    full_name = models.CharField(max_length=255)
    skills = models.JSONField(default=list, blank=True)
    availability = models.JSONField(default=list, blank=True)
    capacity = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class MatchRecommendation(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name="match_recommendations")
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE, related_name="match_recommendations")
    score = models.PositiveIntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_match_recommendations"
    )
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_match_recommendations"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-score", "-created_at"]

    def __str__(self):
        return f"{self.learner.full_name} -> {self.instructor.full_name} ({self.score})"


class LearningPlan(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name="learning_plans")
    # AI drafts the plan; it is never shown to a family as final until a human approves it.
    ai_draft = models.TextField(blank=True)
    approved_plan = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_learning_plans"
    )
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_learning_plans"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Learning plan for {self.learner.full_name} ({self.status})"
