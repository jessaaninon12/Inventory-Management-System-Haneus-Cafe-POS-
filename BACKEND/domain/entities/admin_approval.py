"""
AdminApproval domain entity — pure Python, zero framework dependencies.
Represents a pending admin registration approval request.
"""


class AdminApproval:
    """Domain entity for admin approval requests."""

    VALID_STATUSES = ("pending", "approved", "rejected")
    VALID_ACTIONS = ("approve", "reject")

    def __init__(
        self,
        id=None,
        user_id=None,
        user_name="",
        email="",
        status="pending",
        created_at=None,
        decided_at=None,
        decided_by_id=None,
    ):
        self.id = id
        self.user_id = user_id
        self.user_name = user_name
        self.email = email
        self.status = status
        self.created_at = created_at
        self.decided_at = decided_at
        self.decided_by_id = decided_by_id

    def validate(self):
        """Validate entity state. Returns list of error strings."""
        errors = []
        if not self.user_id:
            errors.append("User ID is required.")
        if self.status not in self.VALID_STATUSES:
            errors.append(f"Invalid status '{self.status}'. Must be one of: {', '.join(self.VALID_STATUSES)}.")
        return errors

    def can_transition(self, action):
        """Check if this request can transition via the given action."""
        if action not in self.VALID_ACTIONS:
            return False, f"Invalid action '{action}'. Must be 'approve' or 'reject'."
        if self.status != "pending":
            return False, f"Request is already {self.status}."
        return True, None

    @property
    def is_pending(self):
        return self.status == "pending"

    @property
    def is_approved(self):
        return self.status == "approved"

    @property
    def is_rejected(self):
        return self.status == "rejected"
