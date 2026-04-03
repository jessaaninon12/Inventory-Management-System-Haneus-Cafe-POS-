"""
Staff Dashboard API controller — thin HTTP layer.
Provides aggregated staff dashboard data: weekly earnings, sales metrics,
payroll calculations, best sellers, and recent transactions.
All weekly computations aligned to Monday → Sunday.
"""

from datetime import date, datetime, timedelta

from django.core.cache import cache
from django.db.models import Count, DecimalField, F, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework.response import Response
from rest_framework.views import APIView

from application.services.dashboard_service import DashboardService
from infrastructure.repositories.dashboard_repository import DashboardRepository
from infrastructure.data.models import SaleModel, SaleItemModel, OrderModel, OrderItemModel

# Payroll constants (Philippine standard)
DAILY_RATE = 450
WORKING_DAYS_PER_YEAR = 313

# Cache TTL
_STAFF_DASH_TTL = 30  # 30 seconds


def _get_service():
    return DashboardService(DashboardRepository())


def _get_monday(d):
    """Return the Monday of the week containing date d."""
    return d - timedelta(days=d.weekday())


def _get_sunday(d):
    """Return the Sunday of the week containing date d."""
    return _get_monday(d) + timedelta(days=6)


def _week_sales(monday, sunday):
    """Sum completed sales (orders + POS) for a Mon-Sun range."""
    legacy = (
        OrderItemModel.objects
        .filter(
            order__status="Completed",
            order__date__date__gte=monday,
            order__date__date__lte=sunday,
        )
        .aggregate(
            total=Coalesce(
                Sum(F("quantity") * F("unit_price")),
                Value(0, output_field=DecimalField()),
            )
        )
    )
    pos = (
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
    return float(legacy["total"]) + float(pos["total"])


def _week_sales_count(monday, sunday):
    """Count completed transactions for a Mon-Sun range."""
    legacy = OrderModel.objects.filter(
        status="Completed",
        date__date__gte=monday,
        date__date__lte=sunday,
    ).count()
    pos = SaleModel.objects.filter(
        status="Completed",
        created_at__date__gte=monday,
        created_at__date__lte=sunday,
    ).count()
    return legacy + pos


def _total_sales_count():
    """Count of ALL completed transactions (inception-to-date)."""
    legacy = OrderModel.objects.filter(status="Completed").count()
    pos = SaleModel.objects.filter(status="Completed").count()
    return legacy + pos


def _todays_sales_count(today):
    """Count completed transactions for today."""
    legacy = OrderModel.objects.filter(
        status="Completed", date__date=today
    ).count()
    pos = SaleModel.objects.filter(
        status="Completed", created_at__date=today
    ).count()
    return legacy + pos


def _days_worked_this_week(today, monday):
    """Number of days from Monday to today (inclusive), capped at 7."""
    return min((today - monday).days + 1, 7)


class StaffDashboardController(APIView):
    """
    GET /api/staff/dashboard/
    Returns all staff dashboard data in a single call.
    Cached for 30 seconds.
    """

    def get(self, request):
        cache_key = "staff:dashboard"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        today = date.today()
        monday = _get_monday(today)
        sunday = _get_sunday(today)

        # Previous week for growth comparison
        prev_monday = monday - timedelta(days=7)
        prev_sunday = sunday - timedelta(days=7)

        # ── Weekly Earning ──
        weekly_earning = _week_sales(monday, sunday)

        # ── Growth % ──
        prev_week_earning = _week_sales(prev_monday, prev_sunday)
        if prev_week_earning > 0:
            growth_pct = round(
                ((weekly_earning - prev_week_earning) / prev_week_earning) * 100, 1
            )
        else:
            growth_pct = 0.0

        # ── Sales counts ──
        total_sales_count = _total_sales_count()
        todays_sales_count = _todays_sales_count(today)

        # ── Payroll ──
        days_worked = _days_worked_this_week(today, monday)
        payroll_weekly = DAILY_RATE * days_worked
        payroll_monthly = round((DAILY_RATE * WORKING_DAYS_PER_YEAR) / 12, 2)

        # ── Best Sellers (top 25) ──
        repo = DashboardRepository()
        best_sellers = repo.get_top_selling_products(limit=25)

        # ── Recent Transactions (latest 30) ──
        recent_txns = repo.get_recent_sales(limit=30)

        data = {
            "week_start": monday.strftime("%d %b %Y"),
            "week_end": sunday.strftime("%d %b %Y"),
            "weekly_earning": str(round(weekly_earning, 2)),
            "growth_pct": growth_pct,
            "prev_week_earning": str(round(prev_week_earning, 2)),
            "total_sales_count": total_sales_count,
            "todays_sales_count": todays_sales_count,
            "payroll_weekly": payroll_weekly,
            "payroll_monthly": payroll_monthly,
            "days_worked": days_worked,
            "best_sellers": best_sellers,
            "recent_transactions": recent_txns,
        }

        cache.set(cache_key, data, timeout=_STAFF_DASH_TTL)
        return Response(data)


class StaffDashboardAnalyticsController(APIView):
    """
    GET /api/staff/dashboard/analytics/?date=YYYY-MM-DD
    Returns weekly analytics for a specific selected date.
    The week is computed as the Mon-Sun range containing the date.
    """

    def get(self, request):
        date_str = request.query_params.get("date")
        try:
            selected = datetime.strptime(date_str, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            selected = date.today()

        monday = _get_monday(selected)
        sunday = _get_sunday(selected)
        prev_monday = monday - timedelta(days=7)
        prev_sunday = sunday - timedelta(days=7)

        weekly_earning = _week_sales(monday, sunday)
        prev_week_earning = _week_sales(prev_monday, prev_sunday)

        total_sales_itd = _total_sales_count()
        todays_sales = _todays_sales_count(selected)

        if prev_week_earning > 0:
            growth_pct = round(
                ((weekly_earning - prev_week_earning) / prev_week_earning) * 100, 1
            )
        else:
            growth_pct = 0.0

        return Response({
            "week_start": monday.strftime("%d %b %Y"),
            "week_end": sunday.strftime("%d %b %Y"),
            "weekly_earning": str(round(weekly_earning, 2)),
            "growth_pct": growth_pct,
            "total_sales_count": total_sales_itd,
            "todays_sales_count": todays_sales,
        })
