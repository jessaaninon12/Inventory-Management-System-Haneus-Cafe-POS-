"""
Dashboard API controller — thin HTTP layer.
Aggregates all dashboard data into a single response.
"""

from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from api.schema_serializers import ChartResponseSchema, DashboardResponseSchema
from application.services.dashboard_service import DashboardService
from infrastructure.repositories.dashboard_repository import DashboardRepository


def _get_service():
    return DashboardService(DashboardRepository())


class DashboardController(APIView):
    """
    GET  /api/dashboard/  → aggregated dashboard data
    """

    @extend_schema(tags=["Dashboard"], responses=DashboardResponseSchema)
    def get(self, request):
        service = _get_service()
        dashboard = service.get_dashboard()
        return Response(dashboard.to_dict())


class DashboardChartController(APIView):
    """
    GET /api/dashboard/chart/?period=1Y
    Returns {labels: [...], values: [...]} for the selected period.
    Periods: 1D, 1W, 1M, 3M, 6M, 1Y
    """

    @extend_schema(tags=["Dashboard"], responses=ChartResponseSchema)
    def get(self, request):
        period = request.query_params.get("period", "1Y").upper()
        service = _get_service()
        data = service.get_chart_data(period)
        return Response(data)
