"""
Dashboard repository — concrete implementation using Django ORM.
Provides aggregation queries for dashboard summary data.
"""

from datetime import date, datetime, timedelta

from django.db.models import Avg, DecimalField, F, Sum, Value
from django.db.models.functions import (
    Coalesce,
    ExtractHour,
    ExtractMonth,
    TruncDate,
    TruncWeek,
)
from django.utils import timezone

from application.interfaces.dashboard_repository_interface import (
    DashboardRepositoryInterface,
)
from infrastructure.data.models import OrderItemModel, OrderModel, ProductModel


class DashboardRepository(DashboardRepositoryInterface):

    # ------------------------------------------------------------------
    # Summary cards
    # ------------------------------------------------------------------

    def get_total_sales(self):
        """Sum of (quantity * unit_price) across all completed orders."""
        result = (
            OrderItemModel.objects
            .filter(order__status="Completed")
            .aggregate(
                total=Coalesce(
                    Sum(F("quantity") * F("unit_price")),
                    Value(0, output_field=DecimalField()),
                )
            )
        )
        return float(result["total"])

    def get_total_sales_returns(self):
        """Sum of (quantity * unit_price) across all cancelled orders."""
        result = (
            OrderItemModel.objects
            .filter(order__status="Cancelled")
            .aggregate(
                total=Coalesce(
                    Sum(F("quantity") * F("unit_price")),
                    Value(0, output_field=DecimalField()),
                )
            )
        )
        return float(result["total"])

    def get_total_products_count(self):
        return ProductModel.objects.count()

    def get_profit(self):
        """Revenue minus cost for completed orders."""
        revenue = self.get_total_sales()
        expenses = self.get_total_expenses()
        return revenue - expenses

    def get_total_expenses(self):
        """Sum of (quantity * product.cost) for completed order items."""
        result = (
            OrderItemModel.objects
            .filter(order__status="Completed", product__isnull=False)
            .aggregate(
                total=Coalesce(
                    Sum(F("quantity") * F("product__cost")),
                    Value(0, output_field=DecimalField()),
                )
            )
        )
        return float(result["total"])

    def get_total_orders_today(self):
        today = date.today()
        return OrderModel.objects.filter(date__date=today).count()

    # ------------------------------------------------------------------
    # Charts
    # ------------------------------------------------------------------

    def get_monthly_sales(self, year):
        """Return a list of 12 floats — one per month — for the given year."""
        qs = (
            OrderItemModel.objects
            .filter(order__status="Completed", order__date__year=year)
            .annotate(month=ExtractMonth("order__date"))
            .values("month")
            .annotate(
                total=Coalesce(
                    Sum(F("quantity") * F("unit_price")),
                    Value(0, output_field=DecimalField()),
                )
            )
            .order_by("month")
        )
        monthly = [0.0] * 12
        for row in qs:
            monthly[row["month"] - 1] = float(row["total"])
        return monthly

    # ------------------------------------------------------------------
    # Lists
    # ------------------------------------------------------------------

    def get_top_selling_products(self, limit=5):
        qs = (
            OrderItemModel.objects
            .filter(order__status="Completed")
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
        return [
            {
                "product_name": row["product_name"],
                "total_quantity": row["total_quantity"],
                "total_revenue": str(round(float(row["total_revenue"]), 2)),
            }
            for row in qs
        ]

    def get_low_stock_products(self, limit=5):
        qs = (
            ProductModel.objects
            .filter(stock__lte=F("low_stock_threshold"))
            .order_by("stock")[:limit]
        )
        return [
            {
                "id": p.pk,
                "name": p.name,
                "stock": p.stock,
                "image_url": p.image_url or "",
            }
            for p in qs
        ]

    def get_recent_sales(self, limit=5):
        qs = (
            OrderModel.objects
            .prefetch_related("items")
            .order_by("-date")[:limit]
        )
        results = []
        for order in qs:
            total = sum(
                float(item.unit_price) * item.quantity
                for item in order.items.all()
            )
            first_item = order.items.first()
            results.append({
                "id": order.pk,
                "order_id": order.order_id,
                "customer_name": order.customer_name,
                "product_name": first_item.product_name if first_item else "",
                "category": "",
                "total": str(round(total, 2)),
                "status": order.status,
                "date": str(order.date) if order.date else None,
                "image_url": "",
            })
        return results

    # ------------------------------------------------------------------
    # Period-based analytics
    # ------------------------------------------------------------------

    def get_sales_for_period(self, start, end):
        """Sum of completed order-item revenue between start and end."""
        result = (
            OrderItemModel.objects
            .filter(order__status="Completed", order__date__gte=start, order__date__lt=end)
            .aggregate(total=Coalesce(Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())))
        )
        return float(result["total"])

    def get_expenses_for_period(self, start, end):
        result = (
            OrderItemModel.objects
            .filter(order__status="Completed", order__date__gte=start, order__date__lt=end, product__isnull=False)
            .aggregate(total=Coalesce(Sum(F("quantity") * F("product__cost")), Value(0, output_field=DecimalField())))
        )
        return float(result["total"])

    def get_returns_for_period(self, start, end):
        result = (
            OrderItemModel.objects
            .filter(order__status="Cancelled", order__date__gte=start, order__date__lt=end)
            .aggregate(total=Coalesce(Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())))
        )
        return float(result["total"])

    # ------------------------------------------------------------------
    # Chart data by period
    # ------------------------------------------------------------------

    def get_chart_data(self, period):
        """Return {labels, values} based on period code: 1D, 1W, 1M, 3M, 6M, 1Y."""
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        if period == "1D":
            # 24 hourly buckets for today
            labels = [f"{h:02d}:00" for h in range(24)]
            qs = (
                OrderItemModel.objects
                .filter(order__status="Completed", order__date__gte=today, order__date__lt=today + timedelta(days=1))
                .annotate(hour=ExtractHour("order__date"))
                .values("hour")
                .annotate(total=Coalesce(Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())))
                .order_by("hour")
            )
            values = [0.0] * 24
            for row in qs:
                values[row["hour"]] = float(row["total"])
            return {"labels": labels, "values": values}

        elif period == "1W":
            # 7 daily buckets (Mon-Sun of current week)
            day_of_week = today.weekday()  # 0=Mon
            monday = today - timedelta(days=day_of_week)
            labels = [(monday + timedelta(days=i)).strftime("%a") for i in range(7)]
            qs = (
                OrderItemModel.objects
                .filter(order__status="Completed", order__date__gte=monday, order__date__lt=monday + timedelta(days=7))
                .annotate(day=TruncDate("order__date"))
                .values("day")
                .annotate(total=Coalesce(Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())))
                .order_by("day")
            )
            values = [0.0] * 7
            for row in qs:
                idx = (row["day"] - monday.date()).days
                if 0 <= idx < 7:
                    values[idx] = float(row["total"])
            return {"labels": labels, "values": values}

        elif period == "1M":
            # Daily buckets for current month
            first = today.replace(day=1)
            if first.month == 12:
                next_month = first.replace(year=first.year + 1, month=1)
            else:
                next_month = first.replace(month=first.month + 1)
            days_in_month = (next_month - first).days
            labels = [str(d + 1) for d in range(days_in_month)]
            qs = (
                OrderItemModel.objects
                .filter(order__status="Completed", order__date__gte=first, order__date__lt=next_month)
                .annotate(day=TruncDate("order__date"))
                .values("day")
                .annotate(total=Coalesce(Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())))
                .order_by("day")
            )
            values = [0.0] * days_in_month
            for row in qs:
                idx = row["day"].day - 1
                values[idx] = float(row["total"])
            return {"labels": labels, "values": values}

        elif period == "3M":
            # 12 weekly buckets covering last 12 weeks
            start = today - timedelta(weeks=12)
            labels = []
            boundaries = []
            for i in range(12):
                w_start = start + timedelta(weeks=i)
                boundaries.append(w_start)
                labels.append(w_start.strftime("%b %d"))
            qs = (
                OrderItemModel.objects
                .filter(order__status="Completed", order__date__gte=start, order__date__lt=today + timedelta(days=1))
                .annotate(week=TruncWeek("order__date"))
                .values("week")
                .annotate(total=Coalesce(Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())))
                .order_by("week")
            )
            values = [0.0] * 12
            for row in qs:
                week_date = row["week"]
                if hasattr(week_date, 'date'):
                    week_date = week_date.date()
                for idx in range(11, -1, -1):
                    b = boundaries[idx].date() if hasattr(boundaries[idx], 'date') else boundaries[idx]
                    if week_date >= b:
                        values[idx] += float(row["total"])
                        break
            return {"labels": labels, "values": values}

        elif period == "6M":
            # 6 monthly buckets
            labels = []
            values = []
            for i in range(5, -1, -1):
                m = now.month - i
                y = now.year
                while m <= 0:
                    m += 12
                    y -= 1
                month_start = datetime(y, m, 1, tzinfo=now.tzinfo)
                if m == 12:
                    month_end = datetime(y + 1, 1, 1, tzinfo=now.tzinfo)
                else:
                    month_end = datetime(y, m + 1, 1, tzinfo=now.tzinfo)
                labels.append(month_start.strftime("%b"))
                total = (
                    OrderItemModel.objects
                    .filter(order__status="Completed", order__date__gte=month_start, order__date__lt=month_end)
                    .aggregate(t=Coalesce(Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())))
                )
                values.append(float(total["t"]))
            return {"labels": labels, "values": values}

        else:  # 1Y default
            year = now.year
            monthly = self.get_monthly_sales(year)
            labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            return {"labels": labels, "values": monthly}
