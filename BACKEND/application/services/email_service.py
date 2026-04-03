"""
Email service — send emails for password reset and other notifications.
Uses Django's email backend (configurable via settings.EMAIL_BACKEND).
"""

from django.core.mail import send_mail
from django.conf import settings


class EmailService:
    """Service for sending emails."""
    
    def send_password_reset_email(self, recipient_email: str, reset_url: str) -> bool:
        """Send a password reset email with a token-based reset link."""
        subject = "Password Reset Request — Haneus Cafe POS"
        
        html_message = f"""
        <html>
            <body style="font-family:Arial,sans-serif;background:#f5ede3;padding:24px;">
              <div style="max-width:480px;margin:auto;background:white;border-radius:10px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <h2 style="color:#4a2f21;margin-bottom:8px;">Password Reset Request</h2>
                <p style="color:#6e4f3e;">You requested a password reset for your <strong>Haneus Cafe POS</strong> account.</p>
                <p style="color:#6e4f3e;">Click the button below to reset your password:</p>
                <a href="{reset_url}" style="display:inline-block;background:#c47b42;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:8px 0;">Reset Password</a>
                <p style="color:#999;font-size:0.82rem;margin-top:16px;">This link will expire in 60 minutes. If you didn't request this, you can safely ignore this email.</p>
                <hr style="border:none;border-top:1px solid #e1c8b2;margin:16px 0;"/>
                <p style="color:#bfa78a;font-size:0.78rem;">Haneus Cafe POS System</p>
              </div>
            </body>
        </html>
        """
        
        plain_message = f"Password Reset\n\nReset link: {reset_url}\n\nExpires in 60 minutes.\n\n— Haneus Cafe POS"
        
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
            print(f"[EmailService] Failed to send password reset email to {recipient_email}: {e}")
            return False

    def send_6digit_code_email(self, recipient_email: str, code: str) -> bool:
        """
        Send a 6-digit password reset code via email.
        
        Args:
            recipient_email: User's email address
            code: The 6-digit numeric code (plain text, not hashed)
            
        Returns:
            True if sent successfully, False otherwise
        """
        subject = "Your Password Reset Code — Haneus Cafe POS"

        html_message = f"""
        <html>
            <body style="font-family:Arial,sans-serif;background:#f5ede3;padding:24px;">
              <div style="max-width:480px;margin:auto;background:white;border-radius:10px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <h2 style="color:#4a2f21;margin-bottom:8px;">Password Reset Code</h2>
                <p style="color:#6e4f3e;">You requested a password reset for your <strong>Haneus Cafe POS</strong> account.</p>
                <p style="color:#6e4f3e;">Enter this 6-digit code in the app:</p>
                <div style="text-align:center;margin:20px 0;">
                  <span style="font-size:2.5rem;font-weight:800;letter-spacing:0.35em;color:#c47b42;background:#f5ede3;padding:14px 28px;border-radius:10px;display:inline-block;">{code}</span>
                </div>
                <p style="color:#999;font-size:0.82rem;margin-top:16px;">⏳ This code expires in <strong>15 minutes</strong>.</p>
                <p style="color:#999;font-size:0.82rem;">If you didn't request this, you can safely ignore this email.</p>
                <hr style="border:none;border-top:1px solid #e1c8b2;margin:16px 0;"/>
                <p style="color:#bfa78a;font-size:0.78rem;">Haneus Cafe POS System</p>
              </div>
            </body>
        </html>
        """

        plain_message = (
            f"Your Haneus Cafe POS password reset code: {code}\n\n"
            f"This code expires in 15 minutes.\n\n"
            f"If you didn't request this, ignore this email.\n\n"
            f"— Haneus Cafe POS"
        )

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
            print(f"[EmailService] Failed to send 6-digit code email to {recipient_email}: {e}")
            return False

    def send_approval_notification_email(self, recipient_email: str, user_name: str, status: str) -> bool:
        """Send notification email when admin registration is approved or rejected."""
        if status == "approved":
            subject = "✅ Your Admin Account Has Been Approved — Haneus Cafe POS"
            status_color  = "#16a34a"
            status_label  = "Approved ✅"
            body_html = f"""
                <p style="color:#6e4f3e;">Hello <strong>{user_name}</strong>,</p>
                <p style="color:#6e4f3e;">Great news! Your admin account request for <strong>Haneus Cafe POS</strong> has been <span style="color:#16a34a;font-weight:700;">approved</span>.</p>
                <p style="color:#6e4f3e;">You can now log in with your credentials:</p>
                <a href="http://localhost:8000/login.html" style="display:inline-block;background:#c47b42;color:white;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;margin:8px 0;">Login Now →</a>
                <p style="color:#6e4f3e;margin-top:12px;">Welcome to the team! 🎉</p>
            """
            plain_message = (
                f"Hello {user_name},\n\n"
                f"Your admin account for Haneus Cafe POS has been APPROVED.\n"
                f"You can now log in at: http://localhost:8000/login.html\n\n"
                f"Welcome to the team!\n\n— Haneus Cafe POS"
            )
        else:
            subject = "❌ Your Admin Account Request — Haneus Cafe POS"
            body_html = f"""
                <p style="color:#6e4f3e;">Hello <strong>{user_name}</strong>,</p>
                <p style="color:#6e4f3e;">Your admin account request for <strong>Haneus Cafe POS</strong> has been <span style="color:#dc2626;font-weight:700;">rejected</span>.</p>
                <p style="color:#6e4f3e;">If you believe this is a mistake or have questions, please contact a system administrator.</p>
            """
            plain_message = (
                f"Hello {user_name},\n\n"
                f"Your admin account request for Haneus Cafe POS has been REJECTED.\n"
                f"If you have questions, contact a system administrator.\n\n— Haneus Cafe POS"
            )

        html_message = f"""
        <html>
            <body style="font-family:Arial,sans-serif;background:#f5ede3;padding:24px;">
              <div style="max-width:480px;margin:auto;background:white;border-radius:10px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <h2 style="color:#4a2f21;margin-bottom:8px;">Account Registration Update</h2>
                {body_html}
                <hr style="border:none;border-top:1px solid #e1c8b2;margin:16px 0;"/>
                <p style="color:#bfa78a;font-size:0.78rem;">Haneus Cafe POS System</p>
              </div>
            </body>
        </html>
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
            print(f"[EmailService] Failed to send approval email to {recipient_email}: {e}")
            return False

