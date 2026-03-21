"""
Sale repository interface — defines the contract that infrastructure must implement.
"""

from abc import ABC, abstractmethod


class SaleRepositoryInterface(ABC):

    @abstractmethod
    def get_all(self):
        """Return a list of all Sale domain entities."""
        pass

    @abstractmethod
    def get_by_id(self, pk):
        """Return a single Sale entity by primary key, or None."""
        pass

    @abstractmethod
    def create(self, sale):
        """Persist a new Sale (with items) and return the saved entity."""
        pass

    @abstractmethod
    def update(self, sale):
        """Update an existing Sale and return the saved entity."""
        pass

    @abstractmethod
    def delete(self, pk):
        """Delete a Sale by primary key. Return True on success."""
        pass

    @abstractmethod
    def get_today_count(self):
        """Return the number of sales created today (used for receipt numbering)."""
        pass
