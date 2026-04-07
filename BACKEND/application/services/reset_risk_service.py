"""
Reset risk service — lightweight rule-based risk scoring for password reset attempts.
Replaces heavy ML architecture (Celery/Redis/trained models) with deterministic rules.
Depends only on domain entities, DTOs, and the repository interface.
"""

from datetime import timedelta
from django.utils import timezone

from domain.entities.reset_attempt import ResetAttempt, RiskRules
from application.dtos.reset_attempt_dto import ResetAttemptDTO, RiskAssessmentDTO
from application.interfaces.reset_attempt_repository_interface import (
    ResetAttemptRepositoryInterface,
)


class ResetRiskService:

    def __init__(self, repository: ResetAttemptRepositoryInterface):
        self.repository = repository

    # ------------------------------------------------------------------
    # Risk Assessment
    # ------------------------------------------------------------------

    def assess_risk(self, user_id, ip_address=""):
        """
        Evaluate the risk level for a password reset attempt.
        Uses domain RiskRules (pure Python) for scoring.
        Returns RiskAssessmentDTO.
        """
        now = timezone.now()

        # Gather metrics from repository
        attempts_last_hour = self.repository.count_recent_attempts(
            user_id, now - timedelta(hours=1)
        )
        attempts_last_day = self.repository.count_recent_attempts(
            user_id, now - timedelta(hours=24)
        )
        consecutive_failures = self.repository.count_consecutive_failures(user_id)

        # Delegate scoring to domain rules (no business logic here — just orchestration)
        risk = RiskRules.calculate_risk_score(
            attempts_last_hour=attempts_last_hour,
            attempts_last_day=attempts_last_day,
            consecutive_failures=consecutive_failures,
        )

        return RiskAssessmentDTO.from_domain(risk)

    # ------------------------------------------------------------------
    # Attempt Recording
    # ------------------------------------------------------------------

    def record_attempt(self, user_id, attempt_type, ip_address="", was_successful=False):
        """
        Log a reset attempt for audit and future risk scoring.
        Returns ResetAttemptDTO of the saved record.
        """
        entity = ResetAttempt(
            user_id=user_id,
            attempt_type=attempt_type,
            ip_address=ip_address,
            was_successful=was_successful,
        )

        errors = entity.validate()
        if errors:
            raise ValueError(errors)

        saved = self.repository.create(entity)
        return ResetAttemptDTO.from_entity(saved)

    # ------------------------------------------------------------------
    # Maintenance
    # ------------------------------------------------------------------

    def cleanup_old_attempts(self, days=30):
        """
        Remove reset attempt records older than the specified number of days.
        Returns the number of records deleted.
        """
        cutoff = timezone.now() - timedelta(days=days)
        return self.repository.delete_older_than(cutoff)
