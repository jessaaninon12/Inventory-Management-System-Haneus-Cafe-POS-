"""
Admin Approval API controller — handle approval/rejection of new admin user registrations.

Endpoints covered:
  GET    /api/admin/approval-requests/           — list pending approval requests
  GET    /api/admin/check-approval-status/       — poll approval status by user_id (no auth required)
  POST   /api/admin/approve-user/<pk>/           — approve a user registration
  POST   /api/admin/reject-user/<pk>/            — reject a user registration
"""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import AdminApprovalRequest, User
from api.schema_serializers import ErrorSchema
from api.throttles import AdminApprovalThrottle
from infrastructure.repositories.user_repository import UserRepository


class CheckApprovalStatusController(APIView):
    """
    GET /api/admin/check-approval-status/?user_id=<id>
    Poll the approval status for a pending admin registration.
    No authentication required — used by the registering user while waiting.

    Response: { status: 'pending' | 'approved' | 'rejected' }
    """

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response(
                {"error": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid user_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            approval_request = AdminApprovalRequest.objects.get(user_id=user_id_int)
            return Response({"status": approval_request.status})
        except AdminApprovalRequest.DoesNotExist:
            # No pending request found — check if user still exists
            from api.models import User
            if User.objects.filter(id=user_id_int).exists():
                # User exists but no approval record → was approved and record may have been cleaned
                return Response({"status": "approved"})
            else:
                # User record deleted → was rejected and removed
                return Response({"status": "rejected"})


class ApprovalRequestListController(APIView):
    """
    GET /api/admin/approval-requests/
    List all pending admin approval requests.
    
    Response: { requests: [ { id, user_id, user_name, email, status, created_at }, ... ] }
    """

    @extend_schema(tags=["Admin – Approvals"], responses={200: None})
    def get(self, request):
        requests = AdminApprovalRequest.objects.filter(
            status="pending"
        ).select_related("user").order_by("-created_at")
        
        data = [
            {
                "id": req.id,
                "user_id": req.user.id,
                "user_name": f"{req.user.first_name} {req.user.last_name}".strip(),
                "email": req.user.email,
                "status": req.status,
                "created_at": req.created_at.isoformat(),
            }
            for req in requests
        ]
        
        return Response({"requests": data})


class ApproveUserController(APIView):
    """
    POST /api/admin/approve-user/<pk>/
    Approve a pending user registration (Admin user).
    
    Request:  {} (no body needed)
    Response: { success: true, message: "User approved successfully." }
    """
    throttle_classes = [AdminApprovalThrottle]

    @extend_schema(
        tags=["Admin – Approvals"],
        request=None,
        responses={200: None, 404: ErrorSchema},
    )
    def post(self, request, pk):
        try:
            approval_request = AdminApprovalRequest.objects.get(user_id=pk)
        except AdminApprovalRequest.DoesNotExist:
            return Response(
                {"error": "Approval request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        if approval_request.status != "pending":
            return Response(
                {"error": f"Request is already {approval_request.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get current authenticated user (the approver)
        approver = request.user
        if not approver or not approver.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        # Check if approver is an Admin
        if approver.user_type != "Admin":
            return Response(
                {"error": "Only Admin users can approve registrations."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        # Update approval request
        from django.utils import timezone
        approval_request.status = "approved"
        approval_request.decided_at = timezone.now()
        approval_request.decided_by = approver
        approval_request.save()
        
        return Response(
            {
                "success": True,
                "message": "User approved successfully.",
            }
        )


class RejectUserController(APIView):
    """
    POST /api/admin/reject-user/<pk>/
    Reject a pending user registration and optionally delete the user.
    
    Request:  { delete_user: true|false }  (optional, defaults to true)
    Response: { success: true, message: "User rejected and removed." }
    """
    throttle_classes = [AdminApprovalThrottle]

    @extend_schema(
        tags=["Admin – Approvals"],
        request=None,
        responses={200: None, 404: ErrorSchema},
    )
    def post(self, request, pk):
        try:
            approval_request = AdminApprovalRequest.objects.get(user_id=pk)
        except AdminApprovalRequest.DoesNotExist:
            return Response(
                {"error": "Approval request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        if approval_request.status != "pending":
            return Response(
                {"error": f"Request is already {approval_request.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get current authenticated user (the approver)
        approver = request.user
        if not approver or not approver.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        # Check if approver is an Admin
        if approver.user_type != "Admin":
            return Response(
                {"error": "Only Admin users can reject registrations."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        # Get the user to be rejected
        user_to_reject = approval_request.user
        delete_user = request.data.get("delete_user", True) if request.data else True
        
        # Update approval request
        from django.utils import timezone
        approval_request.status = "rejected"
        approval_request.decided_at = timezone.now()
        approval_request.decided_by = approver
        approval_request.save()
        
        # Optionally delete the user
        if delete_user:
            user_to_reject.delete()
            return Response(
                {
                    "success": True,
                    "message": "User rejected and removed from system.",
                }
            )
        
        return Response(
            {
                "success": True,
                "message": "User rejected.",
            }
        )
