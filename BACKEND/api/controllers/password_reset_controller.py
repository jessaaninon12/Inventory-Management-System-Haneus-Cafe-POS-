"""
Password Reset API controller — handle forgot password and token-based password reset flows.

Endpoints covered:
  POST   /api/auth/forgot-password/              — initiate URL-token reset (send link via email)
  POST   /api/auth/reset-password-with-token/   — verify URL token and reset password
  POST   /api/auth/send-reset-code/             — send 6-digit code via email
  POST   /api/auth/verify-reset-code/           — verify 6-digit code (without consuming it)
  POST   /api/auth/reset-password-with-code/    — verify 6-digit code + reset password
"""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.schema_serializers import ErrorSchema
from api.throttles import AnonPasswordResetThrottle, PasswordResetThrottle
from application.services.password_reset_service import PasswordResetService
from application.services.email_service import EmailService
from infrastructure.repositories.user_repository import UserRepository


def _get_services():
    """Instantiate services."""
    return PasswordResetService(), EmailService()


class ForgotPasswordController(APIView):
    """
    POST /api/auth/forgot-password/
    Initiate a password reset via link (URL token) sent to email.
    """
    throttle_classes = [AnonPasswordResetThrottle, PasswordResetThrottle]

    @extend_schema(tags=["Auth"], request=None, responses={200: None, 400: ErrorSchema})
    def post(self, request):
        email = request.data.get("email", "").strip()
        
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        reset_service, email_service = _get_services()
        repo = UserRepository()
        user = repo.find_by_email(email)
        
        if user:
            plain_token, _ = reset_service.create_reset_token(user)
            reset_url = f"http://localhost:8000/reset-password.html?token={plain_token}"
            email_service.send_password_reset_email(user.email, reset_url)
        
        return Response({
            "success": True,
            "message": "If an account exists with this email, a password reset link will be sent.",
        })


class ResetPasswordWithTokenController(APIView):
    """
    POST /api/auth/reset-password-with-token/
    Verify the reset token and reset the user's password.
    """
    throttle_classes = [AnonPasswordResetThrottle, PasswordResetThrottle]

    @extend_schema(tags=["Auth"], request=None, responses={200: None, 400: ErrorSchema})
    def post(self, request):
        token = request.data.get("token", "").strip()
        new_password = request.data.get("new_password", "").strip()
        
        if not token:
            return Response({"error": "Reset token is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password:
            return Response({"error": "New password is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
        
        reset_service, _ = _get_services()
        user = reset_service.verify_reset_token(token)
        if not user:
            return Response({"error": "Invalid or expired reset token."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        reset_service.use_reset_token(token)

        # Send password changed notification email (best-effort)
        try:
            _, email_service = _get_services()
            user_name = f"{user.first_name} {user.last_name}".strip() or user.username
            email_service.send_password_changed_email(user.email, user_name)
        except Exception:
            pass  # Don't block the response
        
        return Response({
            "success": True,
            "message": "Password reset successfully. You can now login with your new password.",
        })


# ─────────────────────────────────────────────────────────────────────
# 6-digit code flows
# ─────────────────────────────────────────────────────────────────────

class SendResetCodeController(APIView):
    """
    POST /api/auth/send-reset-code/
    Generate a 6-digit code and email it to the user.

    Request:  { email }
    Response: { success: true, message: "..." }
    Always returns success (never reveals if email exists).
    """
    throttle_classes = [AnonPasswordResetThrottle, PasswordResetThrottle]

    @extend_schema(tags=["Auth"], request=None, responses={200: None, 400: ErrorSchema})
    def post(self, request):
        email = request.data.get("email", "").strip()
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        reset_service, email_service = _get_services()
        repo = UserRepository()
        user = repo.find_by_email(email)

        if user:
            code = reset_service.create_6digit_code(user)
            user_name = f"{user.first_name} {user.last_name}".strip() or user.username
            sent = email_service.send_6digit_code_email(user.email, code, user_name=user_name)
            if not sent:
                # Log but don't expose to client
                print(f"[SendResetCode] Failed to send code email to {user.email}")

        return Response({
            "success": True,
            "message": "If an account exists with this email, a 6-digit reset code has been sent.",
        })


class VerifyEmailResetCodeController(APIView):
    """
    POST /api/auth/verify-email-reset-code/
    Check if a 6-digit code is valid WITHOUT consuming it.
    Used by the email reset wizard step to confirm the code before showing "new password" step.

    Request:  { email, code }
    Response: { success: true } or { error: "..." }
    """
    throttle_classes = [AnonPasswordResetThrottle, PasswordResetThrottle]

    @extend_schema(tags=["Auth"], request=None, responses={200: None, 400: ErrorSchema})
    def post(self, request):
        email = request.data.get("email", "").strip()
        code  = request.data.get("code",  "").strip()

        if not email or not code:
            return Response({"error": "Email and code are required."}, status=status.HTTP_400_BAD_REQUEST)

        reset_service, _ = _get_services()
        user = reset_service.verify_6digit_code(email, code)

        if not user:
            return Response({"error": "Invalid or expired code. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": True, "message": "Code verified."})


class ResetPasswordWithCodeController(APIView):
    """
    POST /api/auth/reset-password-with-code/
    Verify 6-digit code and set a new password in one step.

    Request:  { email, code, new_password }
    Response: { success: true, message: "..." }
    """
    throttle_classes = [AnonPasswordResetThrottle, PasswordResetThrottle]

    @extend_schema(tags=["Auth"], request=None, responses={200: None, 400: ErrorSchema})
    def post(self, request):
        email        = request.data.get("email",        "").strip()
        code         = request.data.get("code",         "").strip()
        new_password = request.data.get("new_password", "").strip()

        if not email or not code:
            return Response({"error": "Email and code are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password or len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)

        reset_service, email_service = _get_services()
        user = reset_service.verify_6digit_code(email, code)
        if not user:
            return Response({"error": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        reset_service.use_6digit_code(email, code)

        # Send password changed notification email
        try:
            user_name = f"{user.first_name} {user.last_name}".strip() or user.username
            email_service.send_password_changed_email(user.email, user_name)
        except Exception:
            pass  # Best-effort — don't block the response

        return Response({
            "success": True,
            "message": "Password reset successfully. You can now login with your new password.",
        })

