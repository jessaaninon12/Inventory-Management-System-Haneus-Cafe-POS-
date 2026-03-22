"""
Sales Analytics API controller.
Provides aggregated sales statistics for the Sales page summary cards.
Combines data from both the legacy OrderModel and the POS SaleModel so that
every completed POS transaction is reflected in the summary metrics.
"""

from datetime import date, timedelta

from django.db.models import Avg, Count, DecimalField, F, Sum, Value
from django.db.models.functions import Coalesce
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from api.schema_serializers import SalesAnalyticsResponseSchema
from infrastructure.data.models import OrderItemModel, OrderModel, SaleModel


class SalesAnalyticsController(APIView):
    """
    GET /api/sales/analytics/
    Returns summary stats: today's sales, this week, pending orders, avg order.
    Combines legacy order data (OrderModel) + POS sales (SaleModel).
    """

    @extend_schema(tags=["Sales"], responses=SalesAnalyticsResponseSchema)
    def get(self, request):
        today = date.today()

        # ── Today's Sales ──────────────────────────────────────────────
        # Legacy orders: sum of completed order-item revenue dated today
        legacy_today = (
            OrderItemModel.objects
            .filter(order__status="Completed", order__date__date=today)
            .aggregate(
                total=Coalesce(
                    Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())
                )
            )
        )
        # POS sales: sum of completed sales totals created today
        pos_today = (
            SaleModel.objects
            .filter(status="Completed", created_at__date=today)
            .aggregate(
                total=Coalesce(Sum("total"), Value(0, output_field=DecimalField()))
            )
        )
        todays_sales = float(legacy_today["total"]) + float(pos_today["total"])

        # ── This Week's Sales (Mon–Sun) ────────────────────────────────
        day_of_week = today.weekday()  # 0 = Monday
        monday = today - timedelta(days=day_of_week)
        sunday = monday + timedelta(days=6)

        legacy_week = (
            OrderItemModel.objects
            .filter(
                order__status="Completed",
                order__date__date__gte=monday,
                order__date__date__lte=sunday,
            )
            .aggregate(
                total=Coalesce(
                    Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())
                )
            )
        )
        pos_week = (
            SaleModel.objects
            .filter(
                status="Completed",
                created_at__date__gte=monday,
                created_at__date__lte=sunday,
            )
            .aggregate(
                total=Coalesce(Sum("total"), Value(0, output_field=DecimalField()))
            )
        )
        this_week_sales = float(legacy_week["total"]) + float(pos_week["total"])

        # ── Pending Orders ────────────────────────────────────────────
        # Count pending from both legacy orders and POS sales
        pending_orders = (
            OrderModel.objects.filter(status="Pending").count()
            + SaleModel.objects.filter(status="Pending").count()
        )

        # ── Average Order Value ───────────────────────────────────────
        # Compute per-order totals from legacy orders then average
        legacy_completed = (
            OrderModel.objects
            .filter(status="Completed")
            .annotate(
                order_total=Coalesce(
                    Sum(F("items__quantity") * F("items__unit_price")),
                    Value(0, output_field=DecimalField()),
                )
            )
            .aggregate(avg=Coalesce(Avg("order_total"), Value(0, output_field=DecimalField())))
        )
        legacy_avg = float(legacy_completed["avg"])
        legacy_count = OrderModel.objects.filter(status="Completed").count()

        # POS sales average
        pos_completed = (
            SaleModel.objects
            .filter(status="Completed")
            .aggregate(
                total_sum=Coalesce(Sum("total"), Value(0, output_field=DecimalField())),
                total_count=Count("id"),
            )
        )
        pos_sum = float(pos_completed["total_sum"])
        pos_count = pos_completed["total_count"]

        # Weighted average across both sources
        combined_count = legacy_count + pos_count
        if combined_count > 0:
            combined_sum = (legacy_avg * legacy_count) + pos_sum
            average_order = combined_sum / combined_count
        else:
            average_order = 0.0

        return Response({
            "todays_sales":    str(round(todays_sales, 2)),
            "this_week_sales": str(round(this_week_sales, 2)),
            "pending_orders":  pending_orders,
            "average_order":   str(round(average_order, 2)),
        })
