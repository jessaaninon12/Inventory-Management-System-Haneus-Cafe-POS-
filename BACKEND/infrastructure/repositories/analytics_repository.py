"""
Analytics repository — concrete implementation using Django ORM.
Queries SaleItemModel + ProductModel for analytics aggregation.
"""
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from django.db.models import Sum, F, Value, DecimalField
from django.db.models.functions import Coalesce, ExtractMonth, ExtractYear

from application.interfaces.analytics_repository_interface import (
    AnalyticsRepositoryInterface,
)
from infrastructure.data.models import (
    SaleItemModel,
    SaleModel,
    OrderItemModel,
    ProductModel,
)


def _quarter_date_range(quarter_str: str):
    """Convert '2026-Q1' to (start_date, end_date) timezone-aware datetime range."""
    parts = quarter_str.split("-Q")
    if len(parts) != 2:
        raise ValueError(f"Invalid quarter format: {quarter_str}")
    year = int(parts[0])
    q = int(parts[1])
    quarter_months = {1: (1, 3), 2: (4, 6), 3: (7, 9), 4: (10, 12)}
    start_month, end_month = quarter_months[q]
    from datetime import datetime as dt
    start = timezone.make_aware(dt(year, start_month, 1))
    if end_month == 12:
        end = timezone.make_aware(dt(year + 1, 1, 1))
    else:
        end = timezone.make_aware(dt(year, end_month + 1, 1))
    return start, end


class AnalyticsRepository(AnalyticsRepositoryInterface):

    def get_quarterly_top_selling(self, quarter: str, limit: int = 10) -> list:
        """Top products by quantity sold in a quarter, with price breakdown."""
        start, end = _quarter_date_range(quarter)

        # Aggregate from POS sale_items
        qs = (
            SaleItemModel.objects
            .filter(sale__status="Completed",
                    sale__created_at__gte=start,
                    sale__created_at__lt=end)
            .values("product_name", "unit_price")
            .annotate(
                qty=Coalesce(Sum("quantity"), Value(0)),
                revenue=Coalesce(
                    Sum(F("quantity") * F("unit_price")),
                    Value(0, output_field=DecimalField()),
                ),
            )
            .order_by("-qty")
        )

        # Group by product, accumulate price points
        products = {}
        for row in qs:
            name = row["product_name"]
            if name not in products:
                products[name] = {
                    "total_quantity": 0,
                    "total_revenue": Decimal("0"),
                    "price_points": [],
                }
            products[name]["total_quantity"] += row["qty"]
            products[name]["total_revenue"] += Decimal(str(row["revenue"]))
            products[name]["price_points"].append({
                "unit_price": str(round(float(row["unit_price"]), 2)),
                "quantity_sold": row["qty"],
                "quarter": quarter,
            })

        # Sort by total quantity, take top N
        sorted_products = sorted(
            products.items(), key=lambda x: x[1]["total_quantity"], reverse=True
        )[:limit]

        # Enrich with category + image
        names = [name for name, _ in sorted_products]

        info_qs = ProductModel.objects.filter(name__in=names).values(
            "name", "category", "image_url", "price"
        )
        info_map = {}
        for p in info_qs:
            info_map[p["name"]] = {
                "category": p["category"] or "",
                "image_url": p["image_url"] or "",
                "current_price": str(round(float(p["price"]), 2)),
            }

        result = []
        for rank, (name, data) in enumerate(sorted_products, 1):
            info = info_map.get(name, {})
            result.append({
                "rank": rank,
                "product_name": name,
                "total_quantity": data["total_quantity"],
                "total_revenue": str(round(float(data["total_revenue"]), 2)),
                "category": info.get("category", ""),
                "image_url": info.get("image_url", ""),
                "current_price": info.get("current_price", "0"),
                "price_history": data["price_points"],
            })
        return result

    def get_quarterly_best_selling(self, quarter: str, limit: int = 10) -> list:
        """Top products by revenue in a quarter."""
        start, end = _quarter_date_range(quarter)

        qs = (
            SaleItemModel.objects
            .filter(sale__status="Completed",
                    sale__created_at__gte=start,
                    sale__created_at__lt=end)
            .values("product_name")
            .annotate(
                total_quantity=Coalesce(Sum("quantity"), Value(0)),
                total_revenue=Coalesce(
                    Sum(F("quantity") * F("unit_price")),
                    Value(0, output_field=DecimalField()),
                ),
            )
            .order_by("-total_revenue")[:limit]
        )

        names = [r["product_name"] for r in qs]
        info_qs = ProductModel.objects.filter(name__in=names).values(
            "name", "category", "image_url", "price"
        )
        info_map = {p["name"]: p for p in info_qs}

        result = []
        for rank, row in enumerate(qs, 1):
            info = info_map.get(row["product_name"], {})
            result.append({
                "rank": rank,
                "product_name": row["product_name"],
                "total_quantity": row["total_quantity"],
                "total_revenue": str(round(float(row["total_revenue"]), 2)),
                "category": info.get("category", ""),
                "image_url": info.get("image_url", ""),
                "current_price": str(round(float(info.get("price", 0)), 2)),
            })
        return result

    def get_price_history(self, product_name: str) -> list:
        """All (price, qty, quarter) for a specific product across time."""
        qs = (
            SaleItemModel.objects
            .filter(sale__status="Completed", product_name=product_name)
            .values("unit_price")
            .annotate(
                qty=Coalesce(Sum("quantity"), Value(0)),
            )
            .order_by("-unit_price")
        )
        return [
            {
                "unit_price": str(round(float(row["unit_price"]), 2)),
                "quantity_sold": row["qty"],
            }
            for row in qs
        ]

    def get_monthly_sales_by_product(self, months: int = 3) -> list:
        """Per-product sales for the last N months.
        Returns list of dicts: {product_name, month, year, qty}
        """
        cutoff = timezone.now() - timedelta(days=months * 31)
        qs = (
            SaleItemModel.objects
            .filter(sale__status="Completed", sale__created_at__gte=cutoff)
            .annotate(
                month=ExtractMonth("sale__created_at"),
                year=ExtractYear("sale__created_at"),
            )
            .values("product_name", "month", "year")
            .annotate(
                qty=Coalesce(Sum("quantity"), Value(0)),
            )
            .order_by("product_name", "year", "month")
        )
        return list(qs)

    def get_product_stock_map(self) -> dict:
        """Return {product_name: current_stock}."""
        return dict(
            ProductModel.objects.values_list("name", "stock")
        )

    def get_product_category_map(self) -> dict:
        """Return {product_name: category}."""
        return dict(
            ProductModel.objects.values_list("name", "category")
        )
