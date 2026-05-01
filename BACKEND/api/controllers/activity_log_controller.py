"""
Activity Log controller — thin HTTP layer for activity log endpoints.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from infrastructure.repositories.activity_log_repository import ActivityLogRepository


def _get_repo():
    return ActivityLogRepository()


def _get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")


class ActivityLogListController(APIView):
    """GET /api/activity-logs/?action=CREATE&target_type=product&search=&page=1"""

    def get(self, request):
        try:
            repo = _get_repo()
            action = request.query_params.get("action", None)
            target_type = request.query_params.get("target_type", None)
            search = request.query_params.get("search", None)
            page = int(request.query_params.get("page", 1))
            per_page = int(request.query_params.get("per_page", 25))

            data = repo.get_logs(
                action=action,
                target_type=target_type,
                search=search,
                page=page,
                per_page=per_page,
            )
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to load activity logs: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ActivityLogCreateController(APIView):
    """POST /api/activity-logs/create/
    Body: { user_name, action, target_type, description, target_id? }
    """

    def post(self, request):
        try:
            repo = _get_repo()
            data = request.data
            user_name = data.get("user_name", "System")
            action = data.get("action", "")
            target_type = data.get("target_type", "system")
            description = data.get("description", "")
            target_id = data.get("target_id", "")

            if not action or not description:
                return Response(
                    {"error": "action and description are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            log = repo.log(
                user_name=user_name,
                action=action,
                target_type=target_type,
                description=description,
                target_id=target_id,
                ip_address=_get_client_ip(request),
            )
            return Response(
                {"success": True, "id": log.id},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to create activity log: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ActivityLogStatsController(APIView):
    """GET /api/activity-logs/stats/"""

    def get(self, request):
        try:
            repo = _get_repo()
            data = repo.get_stats()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to load stats: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
