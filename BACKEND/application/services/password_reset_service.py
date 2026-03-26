"""
Password Reset Service — Handles secure password reset token generation and verification.
"""

import secrets
import hashlib
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from api.models import PasswordResetToken, User


class PasswordResetService:
    """Service for managing password reset tokens and operations."""
    
    TOKEN_LENGTH = 32  # 32-character secure tokens
    TOKEN_EXPIRY_MINUTES = 60  # Token valid for 60 minutes
    
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
        
        Args:
            user: User instance
        
        Returns:
            tuple: (plain_token, reset_url)
        """
        # Invalidate any existing tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        
        plain_token, hashed_token = PasswordResetService.generate_reset_token()
        
        # Calculate expiration time
        expires_at = timezone.now() + timedelta(minutes=PasswordResetService.TOKEN_EXPIRY_MINUTES)
        
        # Create the token record
        PasswordResetToken.objects.create(
            user=user,
            token=hashed_token,
            expires_at=expires_at
        )
        
        return plain_token, hashed_token
    
    @staticmethod
    def verify_reset_token(plain_token):
        """
        Verify a password reset token and return the associated user.
        
        Args:
            plain_token: The plain token from the reset link
        
        Returns:
            User or None: The user if token is valid, None otherwise
        """
        hashed_token = hashlib.sha256(plain_token.encode()).hexdigest()
        
        try:
            token_obj = PasswordResetToken.objects.get(
                token=hashed_token,
                is_used=False
            )
            
            # Check expiration
            if token_obj.is_expired:
                return None
            
            return token_obj.user
        
        except PasswordResetToken.DoesNotExist:
            return None
    
    @staticmethod
    def use_reset_token(plain_token):
        """
        Mark a token as used after password has been reset.
        
        Args:
            plain_token: The plain token
        
        Returns:
            bool: True if marked, False if token not found or expired
        """
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
