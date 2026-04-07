"""
Admin Approval API controller — thin HTTP layer.
All business logic lives in AdminApprovalService; this controller only handles
request parsing and response formatting.

Endpoints covered:
  GET    /api/admin/approval-requests/           — list pending approval requests
  POST   /api/admin/approval-requests/           — approve or reject a request
  GET    /api/admin/check-approval-status/       — poll approval status by user_id
  POST   /api/admin/approve-user/<pk>/           — legacy: approve a user (reuses service)
  POST   /api/admin/reject-user/<pk>/            — legacy: reject a user (reuses service)

NOTE: This project uses AllowAny permissions (no token auth on API).
      The admin's user ID is passed in the request body.
"""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.schema_serializers import ErrorSchema
from api.throttles import AdminApprovalThrottle
from application.dtos.admin_approval_dto import ApprovalActionDTO
from application.services.admin_approval_service import AdminApprovalService
from infrastructure.repositories.admin_approval_repository import AdminApprovalRepository


def _get_service():
    """Instantiate AdminApprovalService with its concrete repository."""
    return AdminApprovalService(AdminApprovalRepository())


class CheckApprovalStatusController(APIView):
    """
    GET /api/admin/check-approval-status/?user_id=<id>
    Poll the approval status for a pending admin registration.
    No authentication required — used by the registering user while waiting.

    Response: { status: 'pending' | 'approved' | 'rejected' }
    """

    @extend_schema(tags=["Admin – Approvals"], responses={200: None, 400: ErrorSchema})
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response(
                {"error": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid user_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = _get_service()
        approval_status = service.get_approval_status(user_id)
        return Response({"status": approval_status})


class ApprovalRequestListController(APIView):
    """
    GET  /api/admin/approval-requests/   — list all pending approval requests
    POST /api/admin/approval-requests/   — approve or reject a request

    GET Response:  { requests: [ { id, user_id, user_name, email, status, created_at }, ... ] }
    POST Request:  { user_id: int, action: "approve"|"reject", delete_user: bool }
    POST Response: { success: true, message: "...", approval: { ... } }
    """

    @extend_schema(tags=["Admin – Approvals"], responses={200: None})
    def get(self, request):
        from django.core.cache import cache

        cache_key = "admin:approval_requests:pending"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        service = _get_service()
        dtos = service.get_pending_requests()
        data = [dto.to_dict() for dto in dtos]
        result = {"requests": data}

        cache.set(cache_key, result, timeout=30)
        return Response(result)

    @extend_schema(
        tags=["Admin – Approvals"],
        request=None,
        responses={200: None, 400: ErrorSchema, 404: ErrorSchema},
    )
    def post(self, request):
        action = (request.data.get("action") or "").strip().lower()
        user_id = request.data.get("user_id")
        delete_user = request.data.get("delete_user", True)

        if not action or action not in ("approve", "reject"):
            return Response(
                {"error": "Invalid or missing action. Expected 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user_id is None:
            return Response(
                {"error": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid user_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the approver's user ID from request.user (if authenticated) or request body
        decided_by_id = None
        if request.user and request.user.is_authenticated:
            decided_by_id = request.user.id

        service = _get_service()
        dto = ApprovalActionDTO(
            user_id=user_id,
            action=action,
            decided_by_id=decided_by_id,
            delete_user=delete_user,
        )

        try:
            result_dto = service.approve_or_reject(dto)
            message = (
                "User approved successfully."
                if action == "approve"
                else "User rejected and removed from system."
            )
            return Response({
                "success": True,
                "message": message,
                "approval": result_dto.to_dict(),
            })
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ApproveUserController(APIView):
    """
    POST /api/admin/approve-user/<pk>/
    Legacy endpoint — approve a pending user registration.
    """
    throttle_classes = [AdminApprovalThrottle]

    @extend_schema(
        tags=["Admin – Approvals"],
        request=None,
        responses={200: None, 400: ErrorSchema, 404: ErrorSchema},
    )
    def post(self, request, pk):
        decided_by_id = None
        if request.user and request.user.is_authenticated:
            decided_by_id = request.user.id

        service = _get_service()
        dto = ApprovalActionDTO(
            user_id=pk,
            action="approve",
            decided_by_id=decided_by_id,
            delete_user=True,
        )

        try:
            service.approve_or_reject(dto)
            return Response({"success": True, "message": "User approved successfully."})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RejectUserController(APIView):
    """
    POST /api/admin/reject-user/<pk>/
    Legacy endpoint — reject a pending user registration.
    """
    throttle_classes = [AdminApprovalThrottle]

    @extend_schema(
        tags=["Admin – Approvals"],
        request=None,
        responses={200: None, 400: ErrorSchema, 404: ErrorSchema},
    )
    def post(self, request, pk):
        delete_user = request.data.get("delete_user", True) if request.data else True
        decided_by_id = None
        if request.user and request.user.is_authenticated:
            decided_by_id = request.user.id

        service = _get_service()
        dto = ApprovalActionDTO(
            user_id=pk,
            action="reject",
            decided_by_id=decided_by_id,
            delete_user=delete_user,
        )

        try:
            service.approve_or_reject(dto)
            message = "User rejected and removed from system." if delete_user else "User rejected."
            return Response({"success": True, "message": message})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
