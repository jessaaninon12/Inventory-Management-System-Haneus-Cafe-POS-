"""
Custom throttle classes for sensitive endpoints.
Provides stricter rate limiting for auth, password reset, and approval endpoints.
"""

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class LoginThrottle(UserRateThrottle):
    """
    Throttle login attempts: 10 per minute per user, 50 per minute per IP.
    Prevents brute force attacks.
    """
    scope = "login"


class AnonLoginThrottle(AnonRateThrottle):
    """
    Throttle anonymous login attempts: 20 per minute per IP.
    """
    scope = "anon_login"


class PasswordResetThrottle(UserRateThrottle):
    """
    Throttle password reset requests: 3 per hour per user.
    Prevents abuse of password reset mechanism.
    """
    scope = "password_reset"


class AnonPasswordResetThrottle(AnonRateThrottle):
    """
    Throttle anonymous password reset requests: 5 per hour per IP.
    """
    scope = "anon_password_reset"


class AdminApprovalThrottle(UserRateThrottle):
    """
    Throttle admin approval actions: 30 per minute per user.
    Allows admins to process approvals without hitting limits.
    """
    scope = "admin_approval"
