from django.contrib import admin
from django.urls import include, path

from core.views import ThrottledObtainAuthToken

urlpatterns = [
    path("admin/", admin.site.urls),
    # POST {"username": "...", "password": "..."} -> {"token": "..."}
    path("api/auth/login/", ThrottledObtainAuthToken.as_view(), name="api-login"),
    path("api/", include("core.urls")),
]
