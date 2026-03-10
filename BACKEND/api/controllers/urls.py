"""
Clean Architecture API URL configuration.
All endpoints are prefixed with /api/ by the root config/urls.py.
"""

from django.urls import path

from api.controllers.product_controller import (
    LowStockController,
    ProductDetailController,
    ProductListCreateController,
)
from api.controllers.order_controller import (
    OrderCancelController,
    OrderCompleteController,
    OrderDetailController,
    OrderListCreateController,
)
from api.controllers.inventory_controller import (
    InventorySummaryController,
    LowStockInventoryController,
    ProductHistoryController,
    StockAdjustController,
)
from api.controllers.dashboard_controller import (
    DashboardChartController,
    DashboardController,
)
from api.controllers.sales_analytics_controller import SalesAnalyticsController

urlpatterns = [
    # ── Dashboard ─────────────────────────────────────────────────────────
    path("dashboard/", DashboardController.as_view(), name="dashboard"),
    path("dashboard/chart/", DashboardChartController.as_view(), name="dashboard-chart"),

    # ── Products ──────────────────────────────────────────────────────
    path("products/", ProductListCreateController.as_view(), name="product-list-v2"),
    path("products/low-stock/", LowStockController.as_view(), name="product-low-stock"),
    path("products/<int:pk>/", ProductDetailController.as_view(), name="product-detail-v2"),

    # ── Orders ────────────────────────────────────────────────────────
    path("orders/", OrderListCreateController.as_view(), name="order-list"),
    path("orders/<int:pk>/", OrderDetailController.as_view(), name="order-detail"),
    path("orders/<int:pk>/cancel/", OrderCancelController.as_view(), name="order-cancel"),
    path("orders/<int:pk>/complete/", OrderCompleteController.as_view(), name="order-complete"),

    # ── Sales Analytics ───────────────────────────────────────────────────
    path("sales/analytics/", SalesAnalyticsController.as_view(), name="sales-analytics"),

    # ── Inventory ─────────────────────────────────────────────────────────
    path("inventory/", InventorySummaryController.as_view(), name="inventory-summary"),
    path("inventory/low-stock/", LowStockInventoryController.as_view(), name="inventory-low-stock"),
    path("inventory/adjust/", StockAdjustController.as_view(), name="inventory-adjust"),
    path("inventory/<int:product_id>/history/", ProductHistoryController.as_view(), name="inventory-history"),
]
