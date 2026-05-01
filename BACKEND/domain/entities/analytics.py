"""
Analytics domain entities — pure Python, zero framework dependencies.
"""
from dataclasses import dataclass, field
from typing import List, Optional
from decimal import Decimal


@dataclass
class PricePoint:
    """A single (price, quantity_sold) pair for a product in a given quarter."""
    unit_price: Decimal
    quantity_sold: int
    quarter: str = ""


@dataclass
class ProductAnalytics:
    """Aggregated analytics for a single product."""
    product_name: str
    total_quantity: int = 0
    total_revenue: Decimal = Decimal("0")
    category: str = ""
    image_url: str = ""
    price_history: List[PricePoint] = field(default_factory=list)
    current_price: Decimal = Decimal("0")

    def to_dict(self):
        return {
            "product_name": self.product_name,
            "total_quantity": self.total_quantity,
            "total_revenue": str(round(float(self.total_revenue), 2)),
            "category": self.category,
            "image_url": self.image_url,
            "current_price": str(round(float(self.current_price), 2)),
            "price_history": [
                {
                    "unit_price": str(round(float(p.unit_price), 2)),
                    "quantity_sold": p.quantity_sold,
                    "quarter": p.quarter,
                }
                for p in self.price_history
            ],
        }


@dataclass
class ProductPrediction:
    """Monthly prediction for a product's sales performance."""
    product_name: str
    category: str = ""
    current_stock: int = 0
    # last 3 months' unit sales
    month_1_qty: int = 0
    month_2_qty: int = 0
    month_3_qty: int = 0
    forecast_qty: int = 0           # Simple Moving Average
    sell_through_rate: float = 0.0  # Sold / (Sold + Stock)
    classification: str = "Normal"  # Top-selling / Least-selling / Dead stock
    month_over_month_change: float = 0.0  # % change from M2 → M3

    def compute_forecast(self):
        """SMA-3: average of last 3 months."""
        total = self.month_1_qty + self.month_2_qty + self.month_3_qty
        self.forecast_qty = round(total / 3) if total else 0

    def compute_sell_through(self):
        """Sell-Through Rate = Sold / (Sold + Current Stock)."""
        total_sold = self.month_1_qty + self.month_2_qty + self.month_3_qty
        denominator = total_sold + self.current_stock
        self.sell_through_rate = round(total_sold / denominator * 100, 1) if denominator else 0.0

    def compute_classification(self):
        """Classify based on sell-through rate and sales trend."""
        if self.sell_through_rate < 30:
            self.classification = "Dead Stock"
        elif self.month_over_month_change < -40:
            self.classification = "Declining"
        elif self.sell_through_rate >= 70:
            self.classification = "Top Selling"
        elif self.sell_through_rate >= 50:
            self.classification = "Normal"
        else:
            self.classification = "Least Selling"

    def compute_mom_change(self):
        """Month-over-month change from M2 → M3 (most recent)."""
        if self.month_2_qty > 0:
            self.month_over_month_change = round(
                ((self.month_3_qty - self.month_2_qty) / self.month_2_qty) * 100, 1
            )
        else:
            self.month_over_month_change = 0.0

    def to_dict(self):
        return {
            "product_name": self.product_name,
            "category": self.category,
            "current_stock": self.current_stock,
            "month_1_qty": self.month_1_qty,
            "month_2_qty": self.month_2_qty,
            "month_3_qty": self.month_3_qty,
            "forecast_qty": self.forecast_qty,
            "sell_through_rate": self.sell_through_rate,
            "classification": self.classification,
            "month_over_month_change": self.month_over_month_change,
        }
