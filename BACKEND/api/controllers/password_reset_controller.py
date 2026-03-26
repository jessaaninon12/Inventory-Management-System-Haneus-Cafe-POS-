"""
Password Reset API controller — handle forgot password and token-based password reset flows.

Endpoints covered:
  POST   /api/auth/forgot-password/           — initiate password reset (send reset token via email)
  POST   /api/auth/reset-password-with-token/ — verify token and reset password
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
    Initiate a password reset for the user with the given email.
    
    Request:  { email }
    Response: { success: true, message: "Password reset link sent to your email." }
    
    Note: Always returns success for security (don't reveal if email exists).
    """
    throttle_classes = [AnonPasswordResetThrottle, PasswordResetThrottle]

    @extend_schema(
        tags=["Auth"],
        request=None,
        responses={200: None, 400: ErrorSchema},
    )
    def post(self, request):
        email = request.data.get("email", "").strip()
        
        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        reset_service, email_service = _get_services()
        
        # Look up user by email
        repo = UserRepository()
        user = repo.find_by_email(email)
        
        if user:
            # Generate reset token
            plain_token, _ = reset_service.create_reset_token(user)

            # Send email with reset link
            # Token will be passed as query param: /reset-password?token=<plain_token>
            reset_url = f"http://localhost:8000/reset-password?token={plain_token}"
            email_service.send_password_reset_email(user.email, reset_url)
        
        # Always return success for security
        return Response(
            {
                "success": True,
                "message": "If an account exists with this email, a password reset link will be sent.",
            }
        )


class ResetPasswordWithTokenController(APIView):
    """
    POST /api/auth/reset-password-with-token/
    Verify the reset token and reset the user's password.
    
    Request:  { token, new_password }
    Response: { success: true, message: "Password reset successfully." }
    """
    throttle_classes = [AnonPasswordResetThrottle, PasswordResetThrottle]

    @extend_schema(
        tags=["Auth"],
        request=None,
        responses={200: None, 400: ErrorSchema},
    )
    def post(self, request):
        token = request.data.get("token", "").strip()
        new_password = request.data.get("new_password", "").strip()
        
        if not token:
            return Response(
                {"error": "Reset token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not new_password:
            return Response(
                {"error": "New password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        reset_service, _ = _get_services()
        
        # Verify token and get user
        user = reset_service.verify_reset_token(token)
        if not user:
            return Response(
                {"error": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_service.use_reset_token(token)
        
        return Response(
            {
                "success": True,
                "message": "Password reset successfully. You can now login with your new password.",
            }
        )
