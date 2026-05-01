"""
Analytics application service — orchestrates analytics data aggregation.
Depends only on the repository interface and domain entities.
"""
from collections import defaultdict

from django.utils import timezone

from application.interfaces.analytics_repository_interface import (
    AnalyticsRepositoryInterface,
)
from domain.entities.analytics import ProductPrediction


def _current_quarter() -> str:
    """Return current quarter string, e.g. '2026-Q2'."""
    now = timezone.now()
    q = (now.month - 1) // 3 + 1
    return f"{now.year}-Q{q}"


class AnalyticsService:

    def __init__(self, repository: AnalyticsRepositoryInterface):
        self.repository = repository

    # ------------------------------------------------------------------
    # Quarterly Rankings
    # ------------------------------------------------------------------

    def get_quarterly_top_selling(self, quarter: str = None, limit: int = 10):
        """Top selling by quantity for a quarter."""
        quarter = quarter or _current_quarter()
        return self.repository.get_quarterly_top_selling(quarter, limit)

    def get_quarterly_best_selling(self, quarter: str = None, limit: int = 10):
        """Best selling by revenue for a quarter."""
        quarter = quarter or _current_quarter()
        return self.repository.get_quarterly_best_selling(quarter, limit)

    def get_price_history(self, product_name: str):
        """Price history for a specific product."""
        return self.repository.get_price_history(product_name)

    # ------------------------------------------------------------------
    # Monthly Predictions (SMA-3)
    # ------------------------------------------------------------------

    def get_monthly_predictions(self):
        """Compute SMA-3 forecast, sell-through rate, and classification
        for every product that has sales in the last 3 months.
        """
        monthly_data = self.repository.get_monthly_sales_by_product(months=3)
        stock_map = self.repository.get_product_stock_map()
        category_map = self.repository.get_product_category_map()

        # Determine the last 3 calendar months
        now = timezone.now()
        months_list = []
        for i in range(3, 0, -1):
            # Go back i months
            m = now.month - i
            y = now.year
            while m <= 0:
                m += 12
                y -= 1
            months_list.append((y, m))
        # months_list = [(y1, m1), (y2, m2), (y3, m3)] oldest → newest

        # Build per-product monthly buckets
        product_months = defaultdict(lambda: {0: 0, 1: 0, 2: 0})
        for row in monthly_data:
            name = row["product_name"]
            ym = (row["year"], row["month"])
            for idx, target_ym in enumerate(months_list):
                if ym == target_ym:
                    product_months[name][idx] += row["qty"]
                    break

        # Build predictions
        predictions = []
        for name, buckets in product_months.items():
            pred = ProductPrediction(
                product_name=name,
                category=category_map.get(name, ""),
                current_stock=stock_map.get(name, 0),
                month_1_qty=buckets[0],
                month_2_qty=buckets[1],
                month_3_qty=buckets[2],
            )
            pred.compute_forecast()
            pred.compute_sell_through()
            pred.compute_mom_change()
            pred.compute_classification()
            predictions.append(pred)

        # Sort by forecast descending
        predictions.sort(key=lambda p: p.forecast_qty, reverse=True)
        return [p.to_dict() for p in predictions]

    # ------------------------------------------------------------------
    # Sidebar classification helpers
    # ------------------------------------------------------------------

    def get_to_be_sold(self, limit: int = 10):
        """Products with strong demand prediction (Top Selling + Normal)."""
        all_preds = self.get_monthly_predictions()
        return [
            p for p in all_preds
            if p["classification"] in ("Top Selling", "Normal")
        ][:limit]

    def get_not_to_be_sold(self, limit: int = 10):
        """Products unlikely to sell (Dead Stock + Declining)."""
        all_preds = self.get_monthly_predictions()
        return [
            p for p in all_preds
            if p["classification"] in ("Dead Stock", "Declining", "Least Selling")
        ][:limit]
