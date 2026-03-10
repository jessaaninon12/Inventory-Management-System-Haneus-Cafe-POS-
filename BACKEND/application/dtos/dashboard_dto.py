"""
Dashboard data-transfer object used between the API, service, and infrastructure layers.
"""


class DashboardDTO:
    """Aggregated dashboard data for the admin panel."""

    def __init__(
        self,
        total_sales=0.0,
        total_sales_returns=0.0,
        total_products=0,
        profit=0.0,
        total_expenses=0.0,
        total_payment_returns=0.0,
        orders_today=0,
        monthly_sales=None,
        top_selling=None,
        low_stock_products=None,
        recent_sales=None,
        profit_change_pct=0.0,
        expenses_change_pct=0.0,
        returns_change_pct=0.0,
    ):
        self.total_sales = total_sales
        self.total_sales_returns = total_sales_returns
        self.total_products = total_products
        self.profit = profit
        self.total_expenses = total_expenses
        self.total_payment_returns = total_payment_returns
        self.orders_today = orders_today
        self.monthly_sales = monthly_sales or [0.0] * 12
        self.top_selling = top_selling or []
        self.low_stock_products = low_stock_products or []
        self.recent_sales = recent_sales or []
        self.profit_change_pct = profit_change_pct
        self.expenses_change_pct = expenses_change_pct
        self.returns_change_pct = returns_change_pct

    def to_dict(self):
        return {
            "total_sales": str(round(self.total_sales, 2)),
            "total_sales_returns": str(round(self.total_sales_returns, 2)),
            "total_products": self.total_products,
            "profit": str(round(self.profit, 2)),
            "total_expenses": str(round(self.total_expenses, 2)),
            "total_payment_returns": str(round(self.total_payment_returns, 2)),
            "orders_today": self.orders_today,
            "monthly_sales": [str(round(m, 2)) for m in self.monthly_sales],
            "top_selling": self.top_selling,
            "low_stock_products": self.low_stock_products,
            "recent_sales": self.recent_sales,
            "profit_change_pct": round(self.profit_change_pct, 1),
            "expenses_change_pct": round(self.expenses_change_pct, 1),
            "returns_change_pct": round(self.returns_change_pct, 1),
        }
