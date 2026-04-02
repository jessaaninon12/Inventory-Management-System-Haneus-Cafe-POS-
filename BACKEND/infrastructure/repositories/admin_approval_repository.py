"""
Concrete repository for admin approval — Django ORM implementation.
Implements AdminApprovalRepositoryInterface.

All database queries for the approval system live here.
Maps ORM models → domain entities.
"""

from django.utils import timezone

from api.models import AdminApprovalRequest, User
from application.interfaces.admin_approval_repository_interface import AdminApprovalRepositoryInterface
from domain.entities.admin_approval import AdminApproval


class AdminApprovalRepository(AdminApprovalRepositoryInterface):
    """Concrete implementation of AdminApprovalRepositoryInterface using Django ORM."""

    def _to_entity(self, orm_obj):
        """Map an AdminApprovalRequest ORM object to a domain entity."""
        user = orm_obj.user
        return AdminApproval(
            id=orm_obj.id,
            user_id=user.id,
            user_name=f"{user.first_name} {user.last_name}".strip() or user.username,
            email=user.email,
            status=orm_obj.status,
            created_at=orm_obj.created_at,
            decided_at=orm_obj.decided_at,
            decided_by_id=orm_obj.decided_by_id,
        )

    def get_pending_requests(self):
        """Return all pending approval requests as domain entities."""
        queryset = (
            AdminApprovalRequest.objects
            .filter(status="pending")
            .select_related("user")
            .order_by("-created_at")
        )
        return [self._to_entity(obj) for obj in queryset]

    def get_by_user_id(self, user_id):
        """Return approval request for the given user_id, or None."""
        try:
            orm_obj = AdminApprovalRequest.objects.select_related("user").get(user_id=user_id)
            return self._to_entity(orm_obj)
        except AdminApprovalRequest.DoesNotExist:
            return None

    def create_request(self, user_id):
        """Create a new pending approval request. Returns domain entity."""
        user = User.objects.get(id=user_id)
        orm_obj = AdminApprovalRequest.objects.create(user=user, status="pending")
        # Reload with select_related for consistent mapping
        orm_obj = AdminApprovalRequest.objects.select_related("user").get(id=orm_obj.id)
        return self._to_entity(orm_obj)

    def update_status(self, user_id, status, decided_by_id=None):
        """Update the status of an approval request. Returns domain entity."""
        orm_obj = AdminApprovalRequest.objects.select_related("user").get(user_id=user_id)
        orm_obj.status = status
        orm_obj.decided_at = timezone.now()
        if decided_by_id:
            try:
                orm_obj.decided_by = User.objects.get(id=decided_by_id)
            except User.DoesNotExist:
                orm_obj.decided_by = None
        orm_obj.save()

        # ── CRITICAL: activate the user account on approval ──
        if status == "approved":
            user = orm_obj.user
            user.is_active = True
            user.save(update_fields=["is_active"])

        # Invalidate cache
        from django.core.cache import cache
        cache.delete("admin:approval_requests:pending")

        return self._to_entity(orm_obj)

    def delete_user(self, user_id):
        """Delete the User record (used on rejection). Returns True/False."""
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return True
        except User.DoesNotExist:
            return False

    def user_exists(self, user_id):
        """Check if a User record exists."""
        return User.objects.filter(id=user_id).exists()
