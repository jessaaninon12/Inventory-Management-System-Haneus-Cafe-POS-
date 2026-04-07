"""
User repository — concrete implementation using Django ORM.
Implements the contract defined in application.interfaces.
Uses api.models.User (AbstractUser) — the single source of truth for the users table.
Also writes to infrastructure.data.models.UserAdminModel / UserStaffModel for role tables.
"""

from django.contrib.auth import authenticate as django_authenticate

from application.interfaces.user_repository_interface import UserRepositoryInterface
from domain.entities.user import User as UserEntity
from api.models import User as UserModel
from infrastructure.data.models import UserAdminModel, UserStaffModel


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
    
    def find_by_email(self, email):
        """Alias for get_by_email — returns the ORM model instance (not entity)."""
        try:
            return UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            return None

    def username_exists(self, username):
        return UserModel.objects.filter(username=username).exists()

    def email_exists(self, email):
        return UserModel.objects.filter(email=email).exists()

    def authenticate(self, username, password, user_type=""):
        orm_user = django_authenticate(username=username, password=password)
        if orm_user is None:
            return None
        # If a user_type is provided, verify it matches the stored type
        if user_type and orm_user.user_type != user_type:
            return None
        return self._to_entity(orm_user)

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create(self, dto):
        """Create and persist a new user with a hashed password.
        Also inserts a row in the matching role table (useradmin / userstaff).
        """
        user_type = getattr(dto, "user_type", "Staff") or "Staff"
        orm_user = UserModel.objects.create_user(
            username=dto.username,
            email=dto.email,
            password=dto.password,
            first_name=dto.first_name,
            last_name=dto.last_name,
            user_type=user_type,
            is_active=(user_type != "Admin"),  # Admins require approval before active login
        )
        if user_type == "Admin":
            UserAdminModel.objects.create(user=orm_user)
        else:
            UserStaffModel.objects.create(user=orm_user)
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
        orm_user.require_password_change = False
        orm_user.temporary_password_hash = ""
        orm_user.save()
        return True

    def set_temporary_password(self, user_id, hashed_password, require_change=True):
        """Persist a temporary hashed password and set forced password change flag."""
        try:
            orm_user = UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return False
        orm_user.temporary_password_hash = hashed_password
        orm_user.require_password_change = require_change
        orm_user.save()
        return True

    def get_require_password_change(self, user_id):
        """Check if user must change password on next login."""
        try:
            orm_user = UserModel.objects.get(pk=user_id)
            return getattr(orm_user, "require_password_change", False)
        except UserModel.DoesNotExist:
            return False

    def get_temporary_password_hash(self, user_id):
        """Return the stored temporary_password_hash for a user, or empty string."""
        try:
            orm_user = UserModel.objects.get(pk=user_id)
            return getattr(orm_user, "temporary_password_hash", "") or ""
        except UserModel.DoesNotExist:
            return ""

    def get_all_by_type(self, user_type):
        """Return all User entities matching the given user_type."""
        return [
            self._to_entity(m)
            for m in UserModel.objects.filter(user_type=user_type).order_by("id")
        ]

    def delete(self, user_id, deleted_by_id=None):
        """Delete a user by primary key, backing up data first. Returns True on success."""
        try:
            orm_user = UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return False

        # --- Backup record before deletion ---
        try:
            from api.models import DeletedRecordsBackup
            DeletedRecordsBackup.objects.create(
                record_type="user",
                original_id=orm_user.pk,
                data={
                    "id": orm_user.pk,
                    "username": orm_user.username,
                    "email": orm_user.email,
                    "first_name": orm_user.first_name,
                    "last_name": orm_user.last_name,
                    "user_type": orm_user.user_type,
                    "phone": orm_user.phone,
                    "bio": orm_user.bio,
                    "is_active": orm_user.is_active,
                    "date_joined": str(orm_user.date_joined),
                },
                deleted_by_id=deleted_by_id,
            )
        except Exception:
            pass  # Backup failure must not block deletion

        orm_user.delete()
        return True

    # ------------------------------------------------------------------
    # Mapping helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_entity(m):
        """Convert a UserModel ORM instance to a User domain entity."""
        entity = UserEntity(
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
            user_type=getattr(m, "user_type", "Staff"),
        )
        entity.require_password_change = getattr(m, "require_password_change", False)
        entity.profile_picture_url = getattr(m, "profile_picture_url", "")
        return entity
