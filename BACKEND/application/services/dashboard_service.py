"""
Dashboard application service — orchestrates dashboard data aggregation.
Depends only on DTOs and the repository interface.
"""

from datetime import datetime, timedelta

from application.dtos.dashboard_dto import DashboardDTO
from application.interfaces.dashboard_repository_interface import (
    DashboardRepositoryInterface,
)


def _pct_change(current, previous):
    """Calculate percentage change; return 0 if previous is zero."""
    if previous == 0:
        return 0.0
    return round(((current - previous) / abs(previous)) * 100, 2)


class DashboardService:

    def __init__(self, repository: DashboardRepositoryInterface):
        self.repository = repository

    def get_dashboard(self):
        """Build and return a complete DashboardDTO."""
        total_sales = self.repository.get_total_sales()
        total_sales_returns = self.repository.get_total_sales_returns()
        total_products = self.repository.get_total_products_count()
        total_expenses = self.repository.get_total_expenses()
        profit = total_sales - total_expenses
        orders_today = self.repository.get_total_orders_today()

        current_year = datetime.now().year
        monthly_sales = self.repository.get_monthly_sales(current_year)
        top_selling = self.repository.get_top_selling_products(limit=5)
        low_stock = self.repository.get_low_stock_products(limit=5)
        recent_sales = self.repository.get_recent_sales(limit=5)

        # Week-over-week comparison
        now = datetime.now()
        day_of_week = now.weekday()  # 0=Mon
        this_monday = (now - timedelta(days=day_of_week)).replace(hour=0, minute=0, second=0, microsecond=0)
        last_monday = this_monday - timedelta(weeks=1)

        this_week_sales = self.repository.get_sales_for_period(this_monday, now)
        last_week_sales = self.repository.get_sales_for_period(last_monday, this_monday)
        this_week_expenses = self.repository.get_expenses_for_period(this_monday, now)
        last_week_expenses = self.repository.get_expenses_for_period(last_monday, this_monday)
        this_week_returns = self.repository.get_returns_for_period(this_monday, now)
        last_week_returns = self.repository.get_returns_for_period(last_monday, this_monday)

        this_week_profit = this_week_sales - this_week_expenses
        last_week_profit = last_week_sales - last_week_expenses

        return DashboardDTO(
            total_sales=total_sales,
            total_sales_returns=total_sales_returns,
            total_products=total_products,
            profit=profit,
            total_expenses=total_expenses,
            total_payment_returns=total_sales_returns,
            orders_today=orders_today,
            monthly_sales=monthly_sales,
            top_selling=top_selling,
            low_stock_products=low_stock,
            recent_sales=recent_sales,
            profit_change_pct=_pct_change(this_week_profit, last_week_profit),
            expenses_change_pct=_pct_change(this_week_expenses, last_week_expenses),
            returns_change_pct=_pct_change(this_week_returns, last_week_returns),
        )

    def get_chart_data(self, period):
        """Delegate to repository for period-based chart data."""
        return self.repository.get_chart_data(period)
