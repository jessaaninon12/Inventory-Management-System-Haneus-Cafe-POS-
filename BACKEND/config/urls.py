"""
Root URL configuration for Haneus Cafe POS — Clean Architecture.
All API endpoints are mounted under /api/.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as static_serve
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView

from api.views_docs import ScalarView

# Resolve the FRONTEND directory (one level up from BACKEND)
FRONTEND_DIR = settings.BASE_DIR.parent / "FRONTEND"

urlpatterns = [
    path("admin/", admin.site.urls),

    # ── API Documentation ──────────────────────────────────────────
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", ScalarView.as_view(), name="scalar-docs"),          # legacy
    path("api/scaler/v1", ScalarView.as_view(), name="scalar-docs-v1"),   # new canonical
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # ── Auth endpoints (login, register) ───────────────────────────
    # — Clean Architecture endpoints (products, orders, inventory) —
    path("api/", include("api.controllers.urls")),
    path("api/", include("api.urls")),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # ── Serve FRONTEND files (HTML/CSS/JS/images) during development ──
    # This catch-all must come LAST so it doesn't shadow API/admin routes.
    urlpatterns += [
        re_path(
            r"^(?P<path>.*)$",
            static_serve,
            {"document_root": str(FRONTEND_DIR)},
        ),
    ]
