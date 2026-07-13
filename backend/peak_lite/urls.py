from django.contrib import admin
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("admin/", admin.site.urls),
    # POST {"username": "...", "password": "..."} -> {"token": "..."}
    path("api/auth/login/", obtain_auth_token, name="api-login"),
    path("api/", include("core.urls")),
]
