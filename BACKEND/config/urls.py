"""
Root URL configuration for Haneus Cafe POS — Clean Architecture.
All API endpoints are mounted under /api/.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView

from api.views_docs import ScalarView

urlpatterns = [
    path("admin/", admin.site.urls),

    # ── API Documentation ──────────────────────────────────────────
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", ScalarView.as_view(), name="scalar-docs"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # ── Auth endpoints (login, register) ───────────────────────────
    path("api/", include("api.urls")),
    # — Clean Architecture endpoints (products, orders, inventory) —
    path("api/", include("api.controllers.urls")),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
