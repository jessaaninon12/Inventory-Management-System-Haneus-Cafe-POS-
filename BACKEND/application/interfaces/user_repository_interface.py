"""
User repository interface — defines the contract that infrastructure must implement.
"""

from abc import ABC, abstractmethod


class UserRepositoryInterface(ABC):

    @abstractmethod
    def get_by_id(self, user_id):
        """Return a single User entity by primary key, or None."""
        pass

    @abstractmethod
    def get_by_username(self, username):
        """Return a User entity matching the given username, or None."""
        pass

    @abstractmethod
    def get_by_email(self, email):
        """Return a User entity matching the given email, or None."""
        pass

    @abstractmethod
    def username_exists(self, username):
        """Return True if a user with this username already exists."""
        pass

    @abstractmethod
    def email_exists(self, email):
        """Return True if a user with this email already exists."""
        pass

    @abstractmethod
    def create(self, dto):
        """Create a new user from a CreateUserDTO. Returns a User entity."""
        pass

    @abstractmethod
    def update(self, user_id, dto):
        """Update user profile from an UpdateUserDTO. Returns updated User entity or None."""
        pass

    @abstractmethod
    def change_password(self, user_id, new_password):
        """Set a new hashed password. Returns True on success, False if user not found."""
        pass

    @abstractmethod
    def authenticate(self, username, password):
        """Verify credentials. Returns User entity on success, None on failure."""
        pass
