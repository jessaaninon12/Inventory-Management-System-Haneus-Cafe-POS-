"""
User repository — concrete implementation using Django ORM.
Implements the contract defined in application.interfaces.
Uses api.models.User (AbstractUser) — the single source of truth for the users table.
"""

from django.contrib.auth import authenticate as django_authenticate

from application.interfaces.user_repository_interface import UserRepositoryInterface
from domain.entities.user import User as UserEntity
from api.models import User as UserModel


class UserRepository(UserRepositoryInterface):

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_by_id(self, user_id):
        try:
            return self._to_entity(UserModel.objects.get(pk=user_id))
        except UserModel.DoesNotExist:
            return None

    def get_by_username(self, username):
        try:
            return self._to_entity(UserModel.objects.get(username=username))
        except UserModel.DoesNotExist:
            return None

    def get_by_email(self, email):
        try:
            return self._to_entity(UserModel.objects.get(email=email))
        except UserModel.DoesNotExist:
            return None

    def username_exists(self, username):
        return UserModel.objects.filter(username=username).exists()

    def email_exists(self, email):
        return UserModel.objects.filter(email=email).exists()

    def authenticate(self, username, password):
        orm_user = django_authenticate(username=username, password=password)
        if orm_user is None:
            return None
        return self._to_entity(orm_user)

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create(self, dto):
        """Create and persist a new user with a hashed password."""
        orm_user = UserModel.objects.create_user(
            username=dto.username,
            email=dto.email,
            password=dto.password,
            first_name=dto.first_name,
            last_name=dto.last_name,
        )
        return self._to_entity(orm_user)

    def update(self, user_id, dto):
        """Partially update profile fields. Only applies fields that are not None."""
        try:
            orm_user = UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None

        if dto.first_name is not None:
            orm_user.first_name = dto.first_name
        if dto.last_name is not None:
            orm_user.last_name = dto.last_name
        if dto.email is not None:
            orm_user.email = dto.email
        if dto.phone is not None:
            orm_user.phone = dto.phone
        if dto.bio is not None:
            orm_user.bio = dto.bio
        if dto.avatar_url is not None:
            orm_user.avatar_url = dto.avatar_url

        orm_user.save()
        return self._to_entity(orm_user)

    def change_password(self, user_id, new_password):
        """Hash and store a new password. Returns True on success."""
        try:
            orm_user = UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return False

        orm_user.set_password(new_password)
        orm_user.save()
        return True

    # ------------------------------------------------------------------
    # Mapping helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_entity(m):
        """Convert a UserModel ORM instance to a User domain entity."""
        return UserEntity(
            id=m.pk,
            username=m.username,
            email=m.email,
            first_name=m.first_name,
            last_name=m.last_name,
            phone=m.phone,
            bio=m.bio,
            avatar_url=m.avatar_url,
            date_joined=m.date_joined,
            is_active=m.is_active,
        )
