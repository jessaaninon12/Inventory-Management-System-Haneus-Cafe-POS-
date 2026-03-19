"""
User application service — orchestrates business logic.
Depends only on domain entities, DTOs, and the repository interface.
"""

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
