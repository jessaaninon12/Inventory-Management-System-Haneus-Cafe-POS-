"""
Dashboard repository interface — defines the contract for dashboard aggregation queries.
"""

from abc import ABC, abstractmethod


class DashboardRepositoryInterface(ABC):

    @abstractmethod
    def get_total_sales(self):
        """Return the sum of totals for all completed orders."""
        pass

    @abstractmethod
    def get_total_sales_returns(self):
        """Return the sum of totals for all cancelled orders."""
        pass

    @abstractmethod
    def get_total_products_count(self):
        """Return the total number of products."""
        pass

    @abstractmethod
    def get_profit(self):
        """Return revenue minus cost of goods sold for completed orders."""
        pass

    @abstractmethod
    def get_total_expenses(self):
        """Return the total cost of goods sold for completed orders."""
        pass

    @abstractmethod
    def get_monthly_sales(self, year):
        """Return a list of 12 floats representing monthly sales totals for the given year."""
        pass

    @abstractmethod
    def get_top_selling_products(self, limit=5):
        """Return a list of dicts with product_name, total_quantity, total_revenue."""
        pass

    @abstractmethod
    def get_low_stock_products(self, limit=5):
        """Return a list of dicts with product info for low-stock items."""
        pass

    @abstractmethod
    def get_recent_sales(self, limit=5):
        """Return a list of dicts for the most recent orders."""
        pass

    @abstractmethod
    def get_total_orders_today(self):
        """Return the count of orders created today."""
        pass

    @abstractmethod
    def get_sales_for_period(self, start, end):
        """Return total sales (completed) between start and end dates."""
        pass

    @abstractmethod
    def get_expenses_for_period(self, start, end):
        """Return total expenses (cost of completed items) between dates."""
        pass

    @abstractmethod
    def get_returns_for_period(self, start, end):
        """Return total cancelled order value between dates."""
        pass

    @abstractmethod
    def get_chart_data(self, period):
        """Return {labels: [...], values: [...]} for the given period code."""
        pass
