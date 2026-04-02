"""
Clean Architecture API URL configuration.
All endpoints are prefixed with /api/ by the root config/urls.py.
"""

from django.urls import path
from api.controllers.user_controller import (
    AdminResetPasswordController,
    ChangePasswordController,
    ChangeTemporaryPasswordController,
    CheckUsernameController,
    LoginController,
    ProfileDetailController,
    RegisterController,
    VerifyResetCodeController,
    # Admin user management
    AdminUserListController,
    AdminUserDetailController,
    AdminUserCreateController,
    AdminUserEditController,
    AdminUserDeleteController,
    AdminUserPartialEditController,
    # Staff user management
    StaffUserListController,
    StaffUserDetailController,
    StaffUserCreateController,
    StaffUserEditController,
    StaffUserDeleteController,
    StaffUserPartialEditController,
)

from api.controllers.password_reset_controller import (
    ForgotPasswordController,
    ResetPasswordWithTokenController,
)

from api.controllers.admin_approval_controller import (
    ApprovalRequestListController,
    ApproveUserController,
    RejectUserController,
    CheckApprovalStatusController,
)

from api.controllers.product_controller import (
    LowStockController,
    ProductDetailController,
    ProductListCreateController,
    # New standardised product endpoints
    ProductViewListController,
    ProductViewDetailController,
    ProductCreateController,
    ProductEditController,
    ProductDeleteController,
    ProductPartialEditController,
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
from api.controllers.sale_controller import (
    SaleLatestCustomerNumberController,
    SaleListCreateController,
    SaleDetailController,
    SaleComputeTotalsController,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────
    path("auth/register/", RegisterController.as_view(), name="register"),
    path("auth/login/", LoginController.as_view(), name="login"),
    path("auth/check-username/", CheckUsernameController.as_view(), name="check-username"),
    path("auth/change-temporary-password/", ChangeTemporaryPasswordController.as_view(), name="auth-change-temp-password"),
    path("auth/verify-reset-code/", VerifyResetCodeController.as_view(), name="auth-verify-reset-code"),
    path("auth/forgot-password/", ForgotPasswordController.as_view(), name="auth-forgot-password"),
    path("auth/reset-password-with-token/", ResetPasswordWithTokenController.as_view(), name="auth-reset-password-with-token"),

    # ── Profile ─────────────────────────────────────────────────────────
    path("profile/<int:pk>/", ProfileDetailController.as_view(), name="profile-detail"),
    path("profile/<int:pk>/password/", ChangePasswordController.as_view(), name="profile-password"),
    path("users/<int:pk>/reset-password/", AdminResetPasswordController.as_view(), name="user-reset-password"),

    # ── Dashboard ─────────────────────────────────────────────────────
    path("dashboard/", DashboardController.as_view(), name="dashboard"),
    path("dashboard/chart/", DashboardChartController.as_view(), name="dashboard-chart"),

    # ── Products (legacy — kept for backward compatibility) ────────────────
    path("products/", ProductListCreateController.as_view(), name="product-list-v2"),
    path("products/low-stock/", LowStockController.as_view(), name="product-low-stock"),
    path("products/<int:pk>/", ProductDetailController.as_view(), name="product-detail-v2"),

    # ── Products (standardised naming) ──────────────────────────────
    path("products/view/", ProductViewListController.as_view(), name="product-view-list"),
    path("products/view/<int:pk>/", ProductViewDetailController.as_view(), name="product-view-detail"),
    path("products/create/", ProductCreateController.as_view(), name="product-create"),
    path("products/edit/<int:pk>/", ProductEditController.as_view(), name="product-edit"),
    path("products/delete/<int:pk>/", ProductDeleteController.as_view(), name="product-delete"),
    path("products/partialedit/<int:pk>/", ProductPartialEditController.as_view(), name="product-partialedit"),

    # ── Orders ──────────────────────────────────────────────────
    path("orders/", OrderListCreateController.as_view(), name="order-list"),
    path("orders/<int:pk>/", OrderDetailController.as_view(), name="order-detail"),
    path("orders/<int:pk>/cancel/", OrderCancelController.as_view(), name="order-cancel"),
    path("orders/<int:pk>/complete/", OrderCompleteController.as_view(), name="order-complete"),

    # ── POS Sales ─────────────────────────────────────────────────
    path("sales/latest-customer-number/", SaleLatestCustomerNumberController.as_view(), name="sale-latest-customer-number"),
    path("sales/create/", SaleListCreateController.as_view(), name="sale-create"),
    path("sales/view/", SaleListCreateController.as_view(), name="sale-view-list"),
    path("sales/view/<int:pk>/", SaleDetailController.as_view(), name="sale-view-detail"),
    path("sales/edit/<int:pk>/", SaleDetailController.as_view(), name="sale-edit"),
    path("sales/delete/<int:pk>/", SaleDetailController.as_view(), name="sale-delete"),
    path("sales/partialedit/<int:pk>/", SaleDetailController.as_view(), name="sale-partialedit"),
    path("sales/compute-totals/", SaleComputeTotalsController.as_view(), name="sale-compute-totals"),

    # ── Sales Analytics ────────────────────────────────────────────
    path("sales/analytics/", SalesAnalyticsController.as_view(), name="sales-analytics"),

    # ── Inventory ─────────────────────────────────────────────────────
    path("inventory/", InventorySummaryController.as_view(), name="inventory-summary"),
    path("inventory/low-stock/", LowStockInventoryController.as_view(), name="inventory-low-stock"),
    path("inventory/adjust/", StockAdjustController.as_view(), name="inventory-adjust"),
    path("inventory/<int:product_id>/history/", ProductHistoryController.as_view(), name="inventory-history"),

    # ── Users – Admin (standardised naming) ──────────────────────────
    path("users/admin/view/", AdminUserListController.as_view(), name="admin-user-view-list"),
    path("users/admin/view/<int:pk>/", AdminUserDetailController.as_view(), name="admin-user-view-detail"),
    path("users/admin/create/", AdminUserCreateController.as_view(), name="admin-user-create"),
    path("users/admin/edit/<int:pk>/", AdminUserEditController.as_view(), name="admin-user-edit"),
    path("users/admin/delete/<int:pk>/", AdminUserDeleteController.as_view(), name="admin-user-delete"),
    path("users/admin/partialedit/<int:pk>/", AdminUserPartialEditController.as_view(), name="admin-user-partialedit"),

    # ── Users – Staff (standardised naming) ──────────────────────────────────────────────────────
    path("users/staff/view/", StaffUserListController.as_view(), name="staff-user-view-list"),
    path("users/staff/view/<int:pk>/", StaffUserDetailController.as_view(), name="staff-user-view-detail"),
    path("users/staff/create/", StaffUserCreateController.as_view(), name="staff-user-create"),
    path("users/staff/edit/<int:pk>/", StaffUserEditController.as_view(), name="staff-user-edit"),
    path("users/staff/delete/<int:pk>/", StaffUserDeleteController.as_view(), name="staff-user-delete"),
    path("users/staff/partialedit/<int:pk>/", StaffUserPartialEditController.as_view(), name="staff-user-partialedit"),

    # ── Admin Approvals ─────────────────────────────────────────────────────
    path("admin/approval-requests/", ApprovalRequestListController.as_view(), name="admin-approval-requests-list"),
    path("admin/check-approval-status/", CheckApprovalStatusController.as_view(), name="admin-check-approval-status"),
    path("admin/approve-user/<int:pk>/", ApproveUserController.as_view(), name="admin-approve-user"),
    path("admin/reject-user/<int:pk>/", RejectUserController.as_view(), name="admin-reject-user"),
]
