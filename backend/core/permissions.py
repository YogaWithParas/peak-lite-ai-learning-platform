from rest_framework.permissions import BasePermission

from .models import Profile, get_role


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == Profile.ROLE_ADMIN


class IsAdminOrCaseManager(BasePermission):
    """Only admins and case managers may create match recommendations or
    approve/reject AI-generated learning plans."""

    def has_permission(self, request, view):
        return get_role(request.user) in (Profile.ROLE_ADMIN, Profile.ROLE_CASE_MANAGER)


class HasRole(BasePermission):
    """Any authenticated user with a recognized PEAK-Lite role. Fine-grained
    row-level filtering happens in each viewset's get_queryset()."""

    def has_permission(self, request, view):
        return get_role(request.user) is not None
