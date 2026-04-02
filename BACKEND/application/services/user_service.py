"""
User application service — orchestrates business logic.
Depends only on domain entities, DTOs, and the repository interface.
"""

import secrets
import string
from django.contrib.auth.hashers import make_password, check_password

from domain.entities.user import User
from application.dtos.user_dto import UserDTO
from application.interfaces.user_repository_interface import UserRepositoryInterface


class UserService:

    def __init__(self, repository: UserRepositoryInterface):
        self.repository = repository

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def register(self, dto):
        """Validate and persist a new user. Returns UserDTO."""
        # Build a domain entity to run business-rule validation
        entity = User(
            username=dto.username,
            email=dto.email,
            first_name=dto.first_name,
            last_name=dto.last_name,
        )
        errors = entity.validate()

        # user_type validation
        if dto.user_type not in ("Admin", "Staff"):
            errors.append("Account type must be Admin or Staff.")

        # Password length check
        if not dto.password or len(str(dto.password)) < 6:
            errors.append("Password must be at least 6 characters.")

        # Confirm password check
        if dto.confirm_password and dto.password != dto.confirm_password:
            errors.append("Passwords do not match.")

        # Uniqueness checks via repository
        if dto.username and self.repository.username_exists(dto.username):
            errors.append("A user with this username already exists.")
        if dto.email and self.repository.email_exists(dto.email):
            errors.append("A user with this email already exists.")

        if errors:
            raise ValueError(errors)

        saved = self.repository.create(dto)
        return UserDTO.from_entity(saved)

    def change_password(self, user_id, dto):
        """
        Verify current password then apply the new one.
        Raises ValueError if current password is wrong or new password too short.
        Returns True on success, False if user not found.
        """
        user_entity = self.repository.get_by_id(user_id)
        if user_entity is None:
            return False

        # Verify current password
        verified = self.repository.authenticate(user_entity.username, dto.current_password)
        if verified is None:
            raise ValueError("Current password is incorrect.")

        if len(str(dto.new_password)) < 6:
            raise ValueError("New password must be at least 6 characters.")

        return self.repository.change_password(user_id, dto.new_password)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def login(self, dto):
        """Authenticate credentials (and user_type). Returns UserDTO on success, None on failure."""
        user = self.repository.authenticate(dto.username, dto.password, dto.user_type)
        if user is None:
            return None
        return UserDTO.from_entity(user)

    def get_profile(self, user_id):
        """Return a UserDTO for the given user ID, or None."""
        entity = self.repository.get_by_id(user_id)
        if entity is None:
            return None
        return UserDTO.from_entity(entity)

    def update_profile(self, user_id, dto):
        """Partially update a user profile. Returns UserDTO or None."""
        saved = self.repository.update(user_id, dto)
        if saved is None:
            return None
        return UserDTO.from_entity(saved)

    def get_all_users_by_type(self, user_type):
        """Return a list of UserDTOs filtered by user_type ('Admin' or 'Staff')."""
        entities = self.repository.get_all_by_type(user_type)
        return [UserDTO.from_entity(e) for e in entities]

    def delete_user(self, user_id):
        """Delete a user by ID. Returns True on success, False if not found."""
        return self.repository.delete(user_id)

    def check_username_exists(self, username):
        """Return True if the username is already taken."""
        return self.repository.username_exists(username)

    # ------------------------------------------------------------------
    # Reset CODE Password & Forced Password Change
    # ------------------------------------------------------------------

    def generate_reset_code(self):
        """Generate a secure 6-digit numeric reset CODE.
        Returns (plain_code_str, hashed_code_str).
        """
        code = ''.join(secrets.choice(string.digits) for _ in range(6))
        hashed = make_password(code)
        return code, hashed

    def reset_user_password(self, user_id):
        """Admin initiates CODE-based password reset.
        Generates a 6-digit CODE, stores the hash, and flags the user.
        Returns (plain_code, hashed_code) tuple.
        Raises ValueError if user not found.
        """
        user_entity = self.repository.get_by_id(user_id)
        if user_entity is None:
            raise ValueError("User not found.")
        plain_code, hashed_code = self.generate_reset_code()
        # Persist hashed CODE in temporary_password_hash and flag require_password_change
        self.repository.set_temporary_password(user_id, hashed_code, require_change=True)
        return plain_code, hashed_code

    def verify_reset_code(self, user_id, code):
        """Verify a reset CODE against the stored hash.
        Returns True if CODE matches, False otherwise.
        Raises ValueError if user not found or no CODE is pending.
        """
        user_entity = self.repository.get_by_id(user_id)
        if user_entity is None:
            raise ValueError("User not found.")
        if not getattr(user_entity, 'require_password_change', False):
            raise ValueError("No reset CODE is pending for this user.")
        # Retrieve the stored hash and verify
        stored_hash = self.repository.get_temporary_password_hash(user_id)
        if not stored_hash:
            raise ValueError("No reset CODE found.")
        return check_password(code, stored_hash)

    def change_password_from_temporary(self, user_id, new_password, code=None):
        """User changes password after verifying reset CODE.
        If code is provided, verifies it first.
        Returns True on success, False if user not found.
        Raises ValueError for invalid input.
        """
        user_entity = self.repository.get_by_id(user_id)
        if user_entity is None:
            return False

        # Verify CODE if provided
        if code:
            if not self.verify_reset_code(user_id, code):
                raise ValueError("Invalid reset CODE.")

        if len(str(new_password)) < 6:
            raise ValueError("New password must be at least 6 characters.")

        return self.repository.change_password(user_id, new_password)

    def login_with_forced_password_change_check(self, dto):
        """Authenticate user and check if forced password change is needed.
        Returns dict with 'user', 'require_password_change', 'success' flags.
        """
        user = self.repository.authenticate(dto.username, dto.password, dto.user_type)
        if user is None:
            return {'success': False, 'user': None, 'require_password_change': False}
        user_dto = UserDTO.from_entity(user)
        return {
            'success': True,
            'user': user_dto,
            'require_password_change': user.require_password_change
        }

    # ------------------------------------------------------------------
    # Input Normalization
    # ------------------------------------------------------------------

    @staticmethod
    def normalize_first_name(value):
        """Convert to Sentence Case (first letter uppercase, rest lowercase)."""
        return value.strip().capitalize() if value else ""

    @staticmethod
    def normalize_last_name(value):
        """Convert to Sentence Case (first letter uppercase, rest lowercase)."""
        return value.strip().capitalize() if value else ""

    @staticmethod
    def normalize_email(value):
        """Convert to lowercase."""
        return value.strip().lower() if value else ""

    @staticmethod
    def normalize_username(value, case_mode="sentence"):
        """Support case-toggle behavior for username:
        - sentence: First word capitalized
        - title: Title Case
        - upper: UPPERCASE
        - lower: lowercase
        """
        value = value.strip()
        if case_mode == "title":
            return value.title()
        elif case_mode == "upper":
            return value.upper()
        elif case_mode == "lower":
            return value.lower()
        else:  # sentence (default)
            # First word capitalized, rest lowercase
            words = value.split()
            if words:
                words[0] = words[0].capitalize()
            return ' '.join(words)
