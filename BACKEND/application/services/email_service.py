"""
Email service — send emails for password reset and other notifications.
Uses Django's email backend (configurable via settings.EMAIL_BACKEND).

Features:
  • Retry with exponential backoff (3 attempts) to handle transient Gmail 535 errors
  • All exceptions are caught and logged — the server never crashes from email
  • Synchronous with visible logging so issues are diagnosable
"""

import sys
import time
from django.core.mail import send_mail, get_connection
from django.conf import settings


def _log(msg):
    """Print and flush immediately so logs appear in the Django console."""
    print(msg, flush=True)
    sys.stdout.flush()


class EmailService:
    """Service for sending emails with retry support."""

    MAX_RETRIES = 3
    BASE_DELAY = 2  # seconds — doubles each retry (2s, 4s)

    def _send_with_retry(self, subject, plain_message, html_message, recipient_list, label="email"):
        """
        Attempt to send an email up to MAX_RETRIES times with exponential backoff.
        Opens a fresh SMTP connection on each retry to avoid stale-connection issues.
        Returns True on success, False if all retries are exhausted.
        NEVER raises — all exceptions are caught.
        """
        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                connection = get_connection(
                    backend=settings.EMAIL_BACKEND,
                    host=settings.EMAIL_HOST,
                    port=settings.EMAIL_PORT,
                    username=settings.EMAIL_HOST_USER,
                    password=settings.EMAIL_HOST_PASSWORD,
                    use_tls=settings.EMAIL_USE_TLS,
                    fail_silently=False,
                )
                send_mail(
                    subject=subject,
                    message=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipient_list,
                    html_message=html_message,
                    connection=connection,
                    fail_silently=False,
                )
                _log(f"[EmailService] ✅ {label} sent to {recipient_list}"
                     + (f" (retry #{attempt})" if attempt > 1 else ""))
                return True
            except Exception as e:
                last_error = e
                if attempt < self.MAX_RETRIES:
                    delay = self.BASE_DELAY * (2 ** (attempt - 1))
                    _log(f"[EmailService] ⚠️ Attempt {attempt}/{self.MAX_RETRIES} "
                         f"failed for {label}: {e} — retrying in {delay}s…")
                    time.sleep(delay)
                else:
                    _log(f"[EmailService] ❌ All {self.MAX_RETRIES} attempts failed "
                         f"for {label} to {recipient_list}: {last_error}")
        return False

    # ── public API ──────────────────────────────────────────────────

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
            return self._send_with_retry(subject, plain_message, html_message,
                                         [recipient_email], label="Password reset link")
        except Exception as e:
            _log(f"[EmailService] 💥 Unexpected error (password reset): {e}")
            return False

    def send_6digit_code_email(self, recipient_email: str, code: str, user_name: str = "") -> bool:
        """Send a 6-digit password reset code via email."""
        subject = "Your Password Reset Code — Haneus Cafe POS"
        greeting = f"Hi <strong>{user_name}</strong>," if user_name else "Hi,"

        html_message = f"""
        <html>
            <body style="font-family:Arial,sans-serif;background:#f5ede3;padding:24px;">
              <div style="max-width:480px;margin:auto;background:white;border-radius:10px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <h2 style="color:#4a2f21;margin-bottom:8px;">Password Reset Code</h2>
                <p style="color:#6e4f3e;">{greeting}</p>
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

        greeting_plain = f"Hi {user_name}," if user_name else "Hi,"
        plain_message = (
            f"{greeting_plain}\n\n"
            f"Your Haneus Cafe POS password reset code: {code}\n\n"
            f"This code expires in 15 minutes.\n\n"
            f"If you didn't request this, ignore this email.\n\n"
            f"— Haneus Cafe POS"
        )

        try:
            return self._send_with_retry(subject, plain_message, html_message,
                                         [recipient_email], label="6-digit reset code")
        except Exception as e:
            _log(f"[EmailService] 💥 Unexpected error (6-digit code): {e}")
            return False

    def send_approval_notification_email(self, recipient_email: str, user_name: str, status: str) -> bool:
        """Send notification email when admin registration is approved or rejected."""
        if status == "approved":
            subject = "✅ Your Admin Account Has Been Approved — Haneus Cafe POS"
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
                <p style="color:#6e4f3e;">You are <span style="color:#dc2626;font-weight:700;">Rejected</span>.</p>
                <p style="color:#6e4f3e;">Sorry your request didn't get granted.</p>
                <p style="color:#6e4f3e;">If you believe this is a mistake or have questions, please contact a system administrator.</p>
            """
            plain_message = (
                f"Hello {user_name},\n\n"
                f"You are Rejected. Sorry your request didn't get granted.\n"
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

        label = f"Approval notification ({status})"
        try:
            return self._send_with_retry(subject, plain_message, html_message,
                                         [recipient_email], label=label)
        except Exception as e:
            _log(f"[EmailService] 💥 Unexpected error (approval): {e}")
            return False

    def send_password_changed_email(self, recipient_email: str, user_name: str) -> bool:
        """Send notification email when a user's password is successfully changed."""
        from datetime import datetime
        now = datetime.now()
        date_str = now.strftime("%m-%d-%Y")
        time_str = now.strftime("%I:%M:%S %p")

        subject = "🔒 Password Changed — Haneus Cafe POS"
        body_html = f"""
            <p style="color:#6e4f3e;">Hello <strong>{user_name}</strong>,</p>
            <p style="color:#6e4f3e;">The account password is <span style="color:#16a34a;font-weight:700;">changed</span>.</p>
            <p style="color:#6e4f3e;">📅 Date: <strong>{date_str}</strong></p>
            <p style="color:#6e4f3e;">🕐 Time: <strong>{time_str}</strong></p>
            <p style="color:#999;font-size:0.82rem;margin-top:16px;">If you did not make this change, please contact your administrator immediately.</p>
        """

        html_message = f"""
        <html>
            <body style="font-family:Arial,sans-serif;background:#f5ede3;padding:24px;">
              <div style="max-width:480px;margin:auto;background:white;border-radius:10px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <h2 style="color:#4a2f21;margin-bottom:8px;">Password Changed</h2>
                {body_html}
                <hr style="border:none;border-top:1px solid #e1c8b2;margin:16px 0;"/>
                <p style="color:#bfa78a;font-size:0.78rem;">Haneus Cafe POS System</p>
              </div>
            </body>
        </html>
        """

        plain_message = (
            f"Hello {user_name},\n\n"
            f"The account password is changed.\n"
            f"Date: {date_str}\n"
            f"Time: {time_str}\n\n"
            f"If you did not make this change, contact your administrator.\n\n"
            f"— Haneus Cafe POS"
        )

        try:
            return self._send_with_retry(subject, plain_message, html_message,
                                         [recipient_email], label="Password changed notification")
        except Exception as e:
            _log(f"[EmailService] 💥 Unexpected error (password changed): {e}")
            return False
