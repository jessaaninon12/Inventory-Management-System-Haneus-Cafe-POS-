"""
Reset attempt domain entity — pure business logic, no framework dependencies.
Risk scoring rules for password reset attempts.
"""

from datetime import datetime


class ResetAttempt:
    """Represents a single password reset attempt for audit and risk tracking."""

    ATTEMPT_TYPES = ("code_verify", "email_reset", "password_change")

    def __init__(
        self,
        id=None,
        user_id=None,
        attempt_type="code_verify",
        ip_address="",
        was_successful=False,
        created_at=None,
    ):
        self.id = id
        self.user_id = user_id
        self.attempt_type = attempt_type
        self.ip_address = ip_address
        self.was_successful = was_successful
        self.created_at = created_at or datetime.now()

    # ------------------------------------------------------------------
    # Business rules
    # ------------------------------------------------------------------

    def validate(self):
        """Return a list of validation error strings (empty list == valid)."""
        errors = []
        if not self.user_id:
            errors.append("User ID is required for a reset attempt.")
        if self.attempt_type not in self.ATTEMPT_TYPES:
            errors.append(
                f"Invalid attempt type. Must be one of: {', '.join(self.ATTEMPT_TYPES)}"
            )
        return errors

    def __str__(self):
        return f"ResetAttempt(user={self.user_id}, type={self.attempt_type}, success={self.was_successful})"

    def __repr__(self):
        return f"ResetAttempt(id={self.id}, user_id={self.user_id})"


class RiskAssessment:
    """Result of a risk evaluation — score + level + reason."""

    LEVEL_LOW = "LOW"
    LEVEL_MEDIUM = "MEDIUM"
    LEVEL_HIGH = "HIGH"

    def __init__(self, score=1.0, level="LOW", reason=""):
        self.score = score      # 0.0 (highest risk) to 1.0 (lowest risk)
        self.level = level      # LOW / MEDIUM / HIGH
        self.reason = reason    # Human-readable explanation

    @property
    def is_allowed(self):
        """Returns True if the risk level permits the action."""
        return self.level != self.LEVEL_HIGH

    def __str__(self):
        return f"Risk({self.level}, score={self.score:.2f}, reason='{self.reason}')"


class RiskRules:
    """
    Deterministic rule engine for password reset risk scoring.
    Replaces ML model with threshold-based logic.

    Score interpretation (matches original ML spec from TASKS2.MD):
        > 0.7  → LOW risk    → Approve
        0.4–0.7 → MEDIUM risk → Add delay / extra verification
        < 0.4  → HIGH risk   → Reject attempt
    """

    # Thresholds (configurable constants, not hardcoded magic numbers)
    MAX_ATTEMPTS_PER_HOUR = 3
    MAX_ATTEMPTS_PER_DAY = 5
    MAX_CONSECUTIVE_FAILURES = 2

    SCORE_APPROVE_THRESHOLD = 0.7
    SCORE_CAUTION_THRESHOLD = 0.4

    @staticmethod
    def calculate_risk_score(
        attempts_last_hour,
        attempts_last_day,
        consecutive_failures,
    ):
        """
        Calculate a risk score based on recent attempt patterns.

        Args:
            attempts_last_hour:    Number of reset attempts in the last 60 minutes
            attempts_last_day:     Number of reset attempts in the last 24 hours
            consecutive_failures:  Number of consecutive failed attempts (most recent)

        Returns:
            RiskAssessment with score, level, and reason.
        """
        score = 1.0
        reasons = []

        # Rule 1: Too many attempts in the last hour
        if attempts_last_hour >= RiskRules.MAX_ATTEMPTS_PER_HOUR:
            score -= 0.4
            reasons.append(
                f"{attempts_last_hour} attempts in last hour (max {RiskRules.MAX_ATTEMPTS_PER_HOUR})"
            )
        elif attempts_last_hour >= 2:
            score -= 0.15
            reasons.append(f"{attempts_last_hour} attempts in last hour")

        # Rule 2: Too many attempts in the last day
        if attempts_last_day >= RiskRules.MAX_ATTEMPTS_PER_DAY:
            score -= 0.35
            reasons.append(
                f"{attempts_last_day} attempts in last 24h (max {RiskRules.MAX_ATTEMPTS_PER_DAY})"
            )
        elif attempts_last_day >= 3:
            score -= 0.1
            reasons.append(f"{attempts_last_day} attempts in last 24h")

        # Rule 3: Consecutive failures
        if consecutive_failures >= RiskRules.MAX_CONSECUTIVE_FAILURES:
            score -= 0.3
            reasons.append(
                f"{consecutive_failures} consecutive failures (max {RiskRules.MAX_CONSECUTIVE_FAILURES})"
            )
        elif consecutive_failures >= 1:
            score -= 0.1
            reasons.append(f"{consecutive_failures} consecutive failure(s)")

        # Clamp score to [0.0, 1.0]
        score = max(0.0, min(1.0, score))

        # Determine risk level
        if score > RiskRules.SCORE_APPROVE_THRESHOLD:
            level = RiskAssessment.LEVEL_LOW
        elif score >= RiskRules.SCORE_CAUTION_THRESHOLD:
            level = RiskAssessment.LEVEL_MEDIUM
        else:
            level = RiskAssessment.LEVEL_HIGH

        reason = "; ".join(reasons) if reasons else "No risk factors detected"

        return RiskAssessment(score=score, level=level, reason=reason)
