"""
Reset attempt DTO — data transfer objects for reset attempt records and risk assessments.
"""


class ResetAttemptDTO:
    """Data transfer object for reset attempt records."""

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
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "attempt_type": self.attempt_type,
            "ip_address": self.ip_address,
            "was_successful": self.was_successful,
            "created_at": str(self.created_at) if self.created_at else None,
        }

    @staticmethod
    def from_entity(entity):
        return ResetAttemptDTO(
            id=entity.id,
            user_id=entity.user_id,
            attempt_type=entity.attempt_type,
            ip_address=entity.ip_address,
            was_successful=entity.was_successful,
            created_at=entity.created_at,
        )


class RiskAssessmentDTO:
    """Data transfer object for risk assessment results."""

    def __init__(self, score=1.0, level="LOW", reason="", is_allowed=True):
        self.score = score
        self.level = level
        self.reason = reason
        self.is_allowed = is_allowed

    def to_dict(self):
        return {
            "score": round(self.score, 2),
            "level": self.level,
            "reason": self.reason,
            "is_allowed": self.is_allowed,
        }

    @staticmethod
    def from_domain(risk_assessment):
        return RiskAssessmentDTO(
            score=risk_assessment.score,
            level=risk_assessment.level,
            reason=risk_assessment.reason,
            is_allowed=risk_assessment.is_allowed,
        )
