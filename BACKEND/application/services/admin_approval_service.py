"""
Admin Approval Service — business logic for the admin registration approval system.
Orchestrates domain validation, repository access, and email notifications.

❌ NO Django ORM here — all data access goes through the repository interface.
"""

from application.dtos.admin_approval_dto import AdminApprovalDTO, ApprovalActionDTO
from application.interfaces.admin_approval_repository_interface import AdminApprovalRepositoryInterface
from application.services.email_service import EmailService


class AdminApprovalService:
    """Service for admin approval use-cases."""

    def __init__(self, repository: AdminApprovalRepositoryInterface):
        self._repository = repository
        self._email_service = EmailService()

    def get_pending_requests(self):
        """Get all pending approval requests as DTOs."""
        entities = self._repository.get_pending_requests()
        return [AdminApprovalDTO.from_entity(e) for e in entities]

    def get_approval_status(self, user_id):
        """
        Get the approval status for a user.
        Returns status string: 'pending', 'approved', or 'rejected'.
        If no request found, infers status from user existence.
        """
        entity = self._repository.get_by_user_id(user_id)
        if entity:
            return entity.status

        # No approval record — infer from user existence
        if self._repository.user_exists(user_id):
            return "approved"
        return "rejected"

    def create_approval_request(self, user_id):
        """Create a new pending approval request. Returns DTO."""
        entity = self._repository.create_request(user_id)
        return AdminApprovalDTO.from_entity(entity)

    def approve_or_reject(self, dto: ApprovalActionDTO):
        """
        Process an approve or reject action.

        Business rules:
        1. Request must exist
        2. Request must be in 'pending' status
        3. Action must be 'approve' or 'reject'
        4. On reject: delete the user record
        5. Send email notification

        Returns: AdminApprovalDTO with updated status
        Raises: ValueError if validation fails
        """
        # Fetch the domain entity
        entity = self._repository.get_by_user_id(dto.user_id)
        if entity is None:
            raise ValueError("Approval request not found.")

        # Domain validation — can this request transition?
        can_transition, error = entity.can_transition(dto.action)
        if not can_transition:
            raise ValueError(error)

        # Determine new status
        new_status = "approved" if dto.action == "approve" else "rejected"

        # Update the approval request status
        updated_entity = self._repository.update_status(
            user_id=dto.user_id,
            status=new_status,
            decided_by_id=dto.decided_by_id,
        )

        # On reject: delete the user record
        if dto.action == "reject" and dto.delete_user:
            self._repository.delete_user(dto.user_id)

        # Send email notification (best-effort, don't fail the action)
        try:
            self._email_service.send_approval_notification_email(
                recipient_email=updated_entity.email,
                user_name=updated_entity.user_name,
                status=new_status,
            )
        except Exception:
            pass  # Email failure should not block the approval action

        return AdminApprovalDTO.from_entity(updated_entity)
