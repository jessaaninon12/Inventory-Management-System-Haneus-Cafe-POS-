"""
Reset attempt repository — concrete implementation using Django ORM.
Implements the contract defined in application.interfaces.
Returns Domain entities, NOT ORM models.
"""

from application.interfaces.reset_attempt_repository_interface import (
    ResetAttemptRepositoryInterface,
)
from domain.entities.reset_attempt import ResetAttempt as ResetAttemptEntity
from api.models import ResetAttempt as ResetAttemptModel


class ResetAttemptRepository(ResetAttemptRepositoryInterface):

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create(self, entity):
        """Persist a new reset attempt. Returns domain entity with ID."""
        orm_obj = ResetAttemptModel.objects.create(
            user_id=entity.user_id,
            attempt_type=entity.attempt_type,
            ip_address=entity.ip_address or None,
            was_successful=entity.was_successful,
        )
        return self._to_entity(orm_obj)

    def delete_older_than(self, before_datetime):
        """Delete all attempts older than the given datetime. Returns count deleted."""
        count, _ = ResetAttemptModel.objects.filter(
            created_at__lt=before_datetime
        ).delete()
        return count

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def count_recent_attempts(self, user_id, since_datetime):
        """Count reset attempts for a user since the given datetime."""
        return ResetAttemptModel.objects.filter(
            user_id=user_id,
            created_at__gte=since_datetime,
        ).count()

    def count_consecutive_failures(self, user_id):
        """Count the number of consecutive failed attempts (most recent first).
        Stops counting at the first successful attempt.
        """
        recent_attempts = (
            ResetAttemptModel.objects.filter(user_id=user_id)
            .order_by("-created_at")
            .values_list("was_successful", flat=True)[:10]
        )
        count = 0
        for was_successful in recent_attempts:
            if was_successful:
                break
            count += 1
        return count

    # ------------------------------------------------------------------
    # Mapping helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_entity(m):
        """Convert a ResetAttemptModel ORM instance to a ResetAttempt domain entity."""
        return ResetAttemptEntity(
            id=m.pk,
            user_id=m.user_id,
            attempt_type=m.attempt_type,
            ip_address=m.ip_address or "",
            was_successful=m.was_successful,
            created_at=m.created_at,
        )
