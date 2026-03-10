"""
Serializers used exclusively for OpenAPI schema generation (drf-spectacular).
These are NOT used at runtime — they exist to give Scalar/Swagger/ReDoc
accurate request/response documentation.
"""

from rest_framework import serializers


# ── Auth ──────────────────────────────────────────────────────────────

class RegisterRequestSchema(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()


class UserResponseSchema(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class AuthSuccessSchema(serializers.Serializer):
    success = serializers.BooleanField()
    user = UserResponseSchema()


class LoginRequestSchema(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class ErrorSchema(serializers.Serializer):
    error = serializers.CharField()


# ── Products ──────────────────────────────────────────────────────────

class ProductResponseSchema(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    category = serializers.CharField()
    price = serializers.CharField(help_text="Decimal as string")
    cost = serializers.CharField(help_text="Decimal as string")
    stock = serializers.IntegerField()
    unit = serializers.CharField()
    description = serializers.CharField()
    low_stock_threshold = serializers.IntegerField()
    image_url = serializers.CharField(allow_null=True)
    stock_status = serializers.CharField()
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class CreateProductRequestSchema(serializers.Serializer):
    name = serializers.CharField()
    category = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    stock = serializers.IntegerField(required=False, default=0)
    unit = serializers.CharField(required=False, default="piece")
    description = serializers.CharField(required=False, default="")
    low_stock_threshold = serializers.IntegerField(required=False, default=10)
    image_url = serializers.URLField(required=False, allow_null=True)


class UpdateProductRequestSchema(serializers.Serializer):
    name = serializers.CharField(required=False)
    category = serializers.CharField(required=False)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    stock = serializers.IntegerField(required=False)
    unit = serializers.CharField(required=False)
    description = serializers.CharField(required=False)
    low_stock_threshold = serializers.IntegerField(required=False)
    image_url = serializers.URLField(required=False, allow_null=True)


# ── Orders ────────────────────────────────────────────────────────────

class OrderItemSchema(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class OrderItemResponseSchema(serializers.Serializer):
    id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    quantity = serializers.IntegerField()
    unit_price = serializers.CharField()
    subtotal = serializers.CharField()


class OrderResponseSchema(serializers.Serializer):
    id = serializers.IntegerField()
    order_id = serializers.CharField()
    customer_name = serializers.CharField()
    date = serializers.CharField(allow_null=True)
    total = serializers.CharField()
    status = serializers.CharField()
    items_count = serializers.IntegerField()
    items = OrderItemResponseSchema(many=True)
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class CreateOrderRequestSchema(serializers.Serializer):
    order_id = serializers.CharField()
    customer_name = serializers.CharField()
    date = serializers.DateTimeField()
    status = serializers.ChoiceField(choices=["Pending", "Completed", "Cancelled"], default="Pending")
    items = OrderItemSchema(many=True)


class UpdateOrderRequestSchema(serializers.Serializer):
    customer_name = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    date = serializers.DateTimeField(required=False)


# ── Dashboard ─────────────────────────────────────────────────────────

class TopSellingItemSchema(serializers.Serializer):
    product_name = serializers.CharField()
    total_quantity = serializers.IntegerField()
    total_revenue = serializers.CharField()


class LowStockItemSchema(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    stock = serializers.IntegerField()
    image_url = serializers.CharField(allow_blank=True)


class RecentSaleSchema(serializers.Serializer):
    id = serializers.IntegerField()
    order_id = serializers.CharField()
    customer_name = serializers.CharField()
    product_name = serializers.CharField()
    total = serializers.CharField()
    status = serializers.CharField()
    date = serializers.CharField(allow_null=True)
    image_url = serializers.CharField(allow_blank=True)


class DashboardResponseSchema(serializers.Serializer):
    total_sales = serializers.CharField()
    total_sales_returns = serializers.CharField()
    total_products = serializers.IntegerField()
    profit = serializers.CharField()
    total_expenses = serializers.CharField()
    total_payment_returns = serializers.CharField()
    orders_today = serializers.IntegerField()
    monthly_sales = serializers.ListField(child=serializers.CharField())
    top_selling = TopSellingItemSchema(many=True)
    low_stock_products = LowStockItemSchema(many=True)
    recent_sales = RecentSaleSchema(many=True)


# ── Chart ─────────────────────────────────────────────────────────────

class ChartResponseSchema(serializers.Serializer):
    labels = serializers.ListField(child=serializers.CharField())
    values = serializers.ListField(child=serializers.FloatField())


# ── Sales Analytics ─────────────────────────────────────────────────────

class SalesAnalyticsResponseSchema(serializers.Serializer):
    todays_sales = serializers.CharField()
    this_week_sales = serializers.CharField()
    pending_orders = serializers.IntegerField()
    average_order = serializers.CharField()


# ── Inventory ─────────────────────────────────────────────────────────

class InventoryItemResponseSchema(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    current_stock = serializers.IntegerField()
    unit = serializers.CharField()
    low_stock_threshold = serializers.IntegerField()
    needs_restock = serializers.BooleanField()
    is_critical = serializers.BooleanField()
    stock_percentage = serializers.FloatField()
    restock_suggestion = serializers.IntegerField()


class StockAdjustRequestSchema(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity_change = serializers.IntegerField()
    transaction_type = serializers.CharField(default="adjustment")
    reference = serializers.CharField(required=False, default="")
    notes = serializers.CharField(required=False, default="")


class TransactionResponseSchema(serializers.Serializer):
    id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    quantity_change = serializers.IntegerField()
    transaction_type = serializers.CharField()
    reference = serializers.CharField()
    notes = serializers.CharField()
    timestamp = serializers.CharField(allow_null=True)
