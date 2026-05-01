"""
Analytics repository interface — abstract contract for analytics data access.
"""
from abc import ABC, abstractmethod
from typing import List, Optional


class AnalyticsRepositoryInterface(ABC):

    @abstractmethod
    def get_quarterly_top_selling(self, quarter: str, limit: int = 10) -> list:
        """Return top-selling products for a given quarter (e.g. '2026-Q1'),
        ranked by total quantity sold, with price history breakdown."""
        pass

    @abstractmethod
    def get_quarterly_best_selling(self, quarter: str, limit: int = 10) -> list:
        """Return best-selling products for a given quarter,
        ranked by total revenue."""
        pass

    @abstractmethod
    def get_price_history(self, product_name: str) -> list:
        """Return all (price, qty, quarter) tuples for a product across all quarters."""
        pass

    @abstractmethod
    def get_monthly_sales_by_product(self, months: int = 3) -> list:
        """Return per-product monthly sales aggregations for the last N months."""
        pass

    @abstractmethod
    def get_product_stock_map(self) -> dict:
        """Return {product_name: current_stock} for all products."""
        pass

    @abstractmethod
    def get_product_category_map(self) -> dict:
        """Return {product_name: category} for all products."""
        pass
