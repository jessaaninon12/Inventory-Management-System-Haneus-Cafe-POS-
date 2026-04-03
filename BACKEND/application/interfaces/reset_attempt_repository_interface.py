"""
Reset attempt repository interface — defines the contract for infrastructure implementation.
"""

from abc import ABC, abstractmethod


class ResetAttemptRepositoryInterface(ABC):

    @abstractmethod
    def create(self, entity):
        """Persist a new ResetAttempt entity. Returns the saved entity with ID."""
        pass

    @abstractmethod
    def count_recent_attempts(self, user_id, since_datetime):
        """Count reset attempts for a user since the given datetime."""
        pass

    @abstractmethod
    def count_consecutive_failures(self, user_id):
        """Count the number of consecutive failed attempts (most recent first)."""
        pass

    @abstractmethod
    def delete_older_than(self, before_datetime):
        """Delete all attempts older than the given datetime. Returns count deleted."""
        pass
