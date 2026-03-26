"""
Email service — send emails for password reset and other notifications.
Uses Django's email backend (configurable via settings.EMAIL_BACKEND).
"""

from django.core.mail import send_mail
from django.conf import settings


class EmailService:
    """Service for sending emails."""
    
    def send_password_reset_email(self, recipient_email: str, reset_url: str) -> bool:
        """
        Send a password reset email with a token-based reset link.
        
        Args:
            recipient_email: Email address of the user requesting password reset
            reset_url: Full URL for password reset (includes token as query param)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        subject = "Password Reset Request — Haneus Cafe POS"
        
        # HTML email body
        html_message = f"""
        <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your Haneus Cafe POS account.</p>
                <p>Click the link below to reset your password:</p>
                <p><a href="{reset_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
                <p>This link will expire in 60 minutes.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <hr />
                <p><small>Haneus Cafe POS System</small></p>
            </body>
        </html>
        """
        
        # Plain text fallback
        plain_message = f"""
        Password Reset Request
        
        You requested a password reset for your Haneus Cafe POS account.
        
        Click the link below to reset your password:
        {reset_url}
        
        This link will expire in 60 minutes.
        
        If you didn't request this, you can safely ignore this email.
        
        —
        Haneus Cafe POS System
        """
        
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Failed to send password reset email to {recipient_email}: {str(e)}")
            return False
    
    def send_approval_notification_email(self, recipient_email: str, user_name: str, status: str) -> bool:
        """
        Send notification email when admin registration is approved or rejected.
        
        Args:
            recipient_email: Email address of the user
            user_name: Full name of the user
            status: "approved" or "rejected"
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if status == "approved":
            subject = "Your Admin Account Has Been Approved — Haneus Cafe POS"
            message = f"""
            Your admin account request for Haneus Cafe POS has been approved!
            
            You can now login with your credentials at:
            http://localhost:8000/login
            
            Welcome to the team!
            
            —
            Haneus Cafe POS System
            """
        else:
            subject = "Your Admin Account Request — Haneus Cafe POS"
            message = f"""
            Your admin account request for Haneus Cafe POS has been reviewed and rejected.
            
            If you have questions, please contact a system administrator.
            
            —
            Haneus Cafe POS System
            """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Failed to send approval notification email to {recipient_email}: {str(e)}")
            return False
