"""
Abstract interface for admin approval repository.
Defines the contract that any concrete repository must implement.
Services depend on this interface — never on the concrete implementation.
"""

from abc import ABC, abstractmethod


class AdminApprovalRepositoryInterface(ABC):
    """Contract for admin approval data access."""

    @abstractmethod
    def get_pending_requests(self):
        """Return all pending approval requests as domain entities."""
        pass

    @abstractmethod
    def get_by_user_id(self, user_id):
        """Return approval request for the given user_id, or None."""
        pass

    @abstractmethod
    def create_request(self, user_id):
        """Create a new pending approval request. Returns domain entity."""
        pass

    @abstractmethod
    def update_status(self, user_id, status, decided_by_id=None):
        """Update the status of an approval request. Returns domain entity."""
        pass

    @abstractmethod
    def delete_user(self, user_id):
        """Delete the User record (used on rejection). Returns True/False."""
        pass

    @abstractmethod
    def user_exists(self, user_id):
        """Check if a User record exists. Returns True/False."""
        pass
