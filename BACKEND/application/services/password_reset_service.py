"""
Password Reset Service — Handles secure password reset token generation and verification.
"""

import random
import hashlib
import secrets
from datetime import timedelta
from django.utils import timezone
from api.models import PasswordResetToken, User


class PasswordResetService:
    """Service for managing password reset tokens and operations."""
    
    TOKEN_LENGTH = 32  # 32-character secure tokens
    TOKEN_EXPIRY_MINUTES = 60  # Token valid for 60 minutes
    CODE_EXPIRY_MINUTES = 15   # 6-digit code valid for 15 minutes
    
    @staticmethod
    def generate_reset_token():
        """
        Generate a secure random token.
        Returns: plain token (to send to user), hashed token (to store in DB)
        """
        plain_token = secrets.token_urlsafe(PasswordResetService.TOKEN_LENGTH)
        hashed_token = hashlib.sha256(plain_token.encode()).hexdigest()
        return plain_token, hashed_token
    
    @staticmethod
    def create_reset_token(user):
        """
        Create a new password reset token for a user.
        Returns: tuple: (plain_token, hashed_token)
        """
        # Invalidate any existing tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        
        plain_token, hashed_token = PasswordResetService.generate_reset_token()
        expires_at = timezone.now() + timedelta(minutes=PasswordResetService.TOKEN_EXPIRY_MINUTES)
        
        PasswordResetToken.objects.create(
            user=user,
            token=hashed_token,
            expires_at=expires_at
        )
        
        return plain_token, hashed_token
    
    @staticmethod
    def verify_reset_token(plain_token):
        """Verify a password reset token and return the associated user."""
        hashed_token = hashlib.sha256(plain_token.encode()).hexdigest()
        
        try:
            token_obj = PasswordResetToken.objects.get(
                token=hashed_token,
                is_used=False
            )
            if token_obj.is_expired:
                return None
            return token_obj.user
        
        except PasswordResetToken.DoesNotExist:
            return None
    
    @staticmethod
    def use_reset_token(plain_token):
        """Mark a token as used after password has been reset."""
        hashed_token = hashlib.sha256(plain_token.encode()).hexdigest()
        
        try:
            token_obj = PasswordResetToken.objects.get(token=hashed_token, is_used=False)
            token_obj.is_used = True
            token_obj.save()
            return True
        except PasswordResetToken.DoesNotExist:
            return False
    
    @staticmethod
    def clean_expired_tokens():
        """Delete expired tokens to keep the table clean."""
        PasswordResetToken.objects.filter(expires_at__lt=timezone.now()).delete()

    # ── 6-digit code methods ──────────────────────────────────────────

    @staticmethod
    def generate_6digit_code():
        """Generate a cryptographically random 6-digit numeric code."""
        return f"{random.SystemRandom().randint(0, 999999):06d}"

    @staticmethod
    def create_6digit_code(user):
        """
        Generate a 6-digit code, store its hash in PasswordResetToken,
        and return the plain code to send to the user.
        Expires in 15 minutes.
        """
        # Invalidate previous tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        code = PasswordResetService.generate_6digit_code()
        hashed = hashlib.sha256(code.encode()).hexdigest()
        expires_at = timezone.now() + timedelta(minutes=PasswordResetService.CODE_EXPIRY_MINUTES)

        PasswordResetToken.objects.create(
            user=user,
            token=hashed,
            expires_at=expires_at,
        )
        return code

    @staticmethod
    def verify_6digit_code(email: str, code: str):
        """
        Verify a 6-digit code for the given email.
        Returns the User if valid, or None if invalid/expired.
        """
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None

        hashed = hashlib.sha256(code.encode()).hexdigest()
        try:
            token_obj = PasswordResetToken.objects.get(
                user=user,
                token=hashed,
                is_used=False,
            )
            if token_obj.is_expired:
                return None
            return user
        except PasswordResetToken.DoesNotExist:
            return None

    @staticmethod
    def use_6digit_code(email: str, code: str) -> bool:
        """Mark a code as used."""
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return False

        hashed = hashlib.sha256(code.encode()).hexdigest()
        try:
            token_obj = PasswordResetToken.objects.get(
                user=user, token=hashed, is_used=False
            )
            token_obj.is_used = True
            token_obj.save()
            return True
        except PasswordResetToken.DoesNotExist:
            return False

