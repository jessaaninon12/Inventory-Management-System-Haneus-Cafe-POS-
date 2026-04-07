"""
Admin Approval DTOs — data transfer objects for the approval system.
Used to pass data between Controller ↔ Service layers.
"""


class AdminApprovalDTO:
    """DTO representing an admin approval request for API responses."""

    def __init__(
        self,
        id=None,
        user_id=None,
        user_name="",
        email="",
        status="pending",
        created_at=None,
    ):
        self.id = id
        self.user_id = user_id
        self.user_name = user_name
        self.email = email
        self.status = status
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "email": self.email,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @staticmethod
    def from_entity(entity):
        """Create DTO from a domain entity."""
        return AdminApprovalDTO(
            id=entity.id,
            user_id=entity.user_id,
            user_name=entity.user_name,
            email=entity.email,
            status=entity.status,
            created_at=entity.created_at,
        )


class ApprovalActionDTO:
    """DTO for approve/reject action input."""

    def __init__(self, user_id=None, action="", decided_by_id=None, delete_user=True):
        self.user_id = user_id
        self.action = action
        self.decided_by_id = decided_by_id
        self.delete_user = delete_user
