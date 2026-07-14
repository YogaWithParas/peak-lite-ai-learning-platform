from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from core.views import MeView, ThrottledObtainAuthToken

urlpatterns = [
    path("admin/", admin.site.urls),
    # POST {"username": "...", "password": "..."} -> {"token": "..."}
    path("api/auth/login/", ThrottledObtainAuthToken.as_view(), name="api-login"),
    # GET -> {"username": "...", "role": "..."}
    path("api/auth/me/", MeView.as_view(), name="api-me"),
    path("api/", include("core.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
]
