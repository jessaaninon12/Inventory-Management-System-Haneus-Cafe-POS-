"""
Root URL configuration for Haneus Cafe POS.

All API endpoints are mounted under /api/ and handled by the api app.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]
