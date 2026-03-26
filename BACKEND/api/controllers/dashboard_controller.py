"""
Dashboard API controller — thin HTTP layer.
Aggregates all dashboard data into a single response.
Response caching applied to reduce DB load for high-frequency reads.
"""

from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from api.schema_serializers import ChartResponseSchema, DashboardResponseSchema
from application.services.dashboard_service import DashboardService
from infrastructure.repositories.dashboard_repository import DashboardRepository

# Cache TTL constants (seconds)
_DASHBOARD_CACHE_TTL = 60   # 1 minute — summary cards
_CHART_CACHE_TTL     = 120  # 2 minutes — chart data changes less often


def _get_service():
    return DashboardService(DashboardRepository())


class DashboardController(APIView):
    """
    GET  /api/dashboard/  → aggregated dashboard data
    Cached for 60 seconds to reduce DB aggregation load.
    """

    @extend_schema(tags=["Dashboard"], responses=DashboardResponseSchema)
    def get(self, request):
        cache_key = "dashboard:summary"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        service = _get_service()
        dashboard = service.get_dashboard()
        data = dashboard.to_dict()
        cache.set(cache_key, data, timeout=_DASHBOARD_CACHE_TTL)
        return Response(data)


class DashboardChartController(APIView):
    """
    GET /api/dashboard/chart/?period=1Y
    Returns {labels: [...], values: [...]} for the selected period.
    Periods: 1D, 1W, 1M, 3M, 6M, 1Y
    Cached per period for 2 minutes.
    """

    @extend_schema(tags=["Dashboard"], responses=ChartResponseSchema)
    def get(self, request):
        period = request.query_params.get("period", "1Y").upper()
        cache_key = f"dashboard:chart:{period}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        service = _get_service()
        data = service.get_chart_data(period)
        cache.set(cache_key, data, timeout=_CHART_CACHE_TTL)
        return Response(data)
