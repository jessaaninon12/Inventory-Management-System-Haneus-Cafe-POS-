"""
User domain entity — pure business logic, no framework dependencies.
"""

from datetime import datetime


class User:
    """Represents a system user (cafe staff / admin)."""

    def __init__(
        self,
        id=None,
        username="",
        email="",
        first_name="",
        last_name="",
        phone="",
        bio="",
        avatar_url="",
        date_joined=None,
        is_active=True,
        user_type="Staff",
    ):
        self.id = id
        self.username = username
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.phone = phone
        self.bio = bio
        self.avatar_url = avatar_url
        self.date_joined = date_joined or datetime.now()
        self.is_active = is_active
        self.user_type = user_type

    # ------------------------------------------------------------------
    # Business rules
    # ------------------------------------------------------------------

    @property
    def full_name(self):
        """Return full name, falling back to username if both names are blank."""
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.username

    def validate(self):
        """Return a list of validation error strings (empty list == valid)."""
        errors = []
        if not self.username:
            errors.append("Username is required.")
        if not self.email:
            errors.append("Email is required.")
        if not self.first_name:
            errors.append("First name is required.")
        if not self.last_name:
            errors.append("Last name is required.")
        return errors

    # ------------------------------------------------------------------
    # Dunder helpers
    # ------------------------------------------------------------------

    def __str__(self):
        return f"{self.username} ({self.email})"

    def __repr__(self):
        return f"User(id={self.id}, username='{self.username}')"
