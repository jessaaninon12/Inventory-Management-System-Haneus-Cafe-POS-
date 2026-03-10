"""
Sales Analytics API controller.
Provides aggregated sales statistics for the Sales page summary cards.
"""

from datetime import date, timedelta

from django.db.models import Avg, Count, DecimalField, F, Sum, Value
from django.db.models.functions import Coalesce
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from api.schema_serializers import SalesAnalyticsResponseSchema
from infrastructure.data.models import OrderItemModel, OrderModel


class SalesAnalyticsController(APIView):
    """
    GET /api/sales/analytics/
    Returns summary stats: today's sales, this week, pending orders, avg order.
    """

    @extend_schema(tags=["Sales"], responses=SalesAnalyticsResponseSchema)
    def get(self, request):
        today = date.today()

        # Today's sales = sum of completed order-item revenue where order date is today
        todays = (
            OrderItemModel.objects
            .filter(order__status="Completed", order__date__date=today)
            .aggregate(
                total=Coalesce(
                    Sum(F("quantity") * F("unit_price")), Value(0, output_field=DecimalField())
                )
            )
        )
        todays_sales = float(todays["total"])

        # This week (Mon-Sun)
        day_of_week = today.weekday()  # 0 = Monday
        monday = today - timedelta(days=day_of_week)
        sunday = monday + timedelta(days=6)
        week = (
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
        this_week_sales = float(week["total"])

        # Pending orders count
        pending_orders = OrderModel.objects.filter(status="Pending").count()

        # Average order value (across all completed orders)
        # Compute per-order totals then average
        completed_orders = (
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
        average_order = float(completed_orders["avg"])

        return Response({
            "todays_sales": str(round(todays_sales, 2)),
            "this_week_sales": str(round(this_week_sales, 2)),
            "pending_orders": pending_orders,
            "average_order": str(round(average_order, 2)),
        })
