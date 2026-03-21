"""
Django ORM models — infrastructure layer.

These models map directly to database tables and are the only place
where Django ORM is used.  Repositories translate between these models
and the domain entities.
"""

from django.conf import settings
from django.db import models


# ------------------------------------------------------------------
# User role tables
# ------------------------------------------------------------------
class UserAdminModel(models.Model):
    """Maps to the ``useradmin`` table. One row per Admin-type user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_profile",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "useradmin"

    def __str__(self):
        return f"Admin: {self.user.username}"


class UserStaffModel(models.Model):
    """Maps to the ``userstaff`` table. One row per Staff-type user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_profile",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "userstaff"

    def __str__(self):
        return f"Staff: {self.user.username}"


# ------------------------------------------------------------------
# Product
# ------------------------------------------------------------------
class ProductModel(models.Model):
    """Maps to the ``products`` table."""

    CATEGORY_CHOICES = [
        ("Beverages", "Beverages"),
        ("Desserts", "Desserts"),
        ("Pastries", "Pastries"),
        ("Ingredients", "Ingredients / Supplies"),
        ("Merchandise", "Merchandise"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.IntegerField(default=0)
    unit = models.CharField(max_length=50, default="piece")
    description = models.TextField(blank=True, default="")
    low_stock_threshold = models.IntegerField(default=10)
    image_url = models.TextField(blank=True, null=True)  # stores URL or base64 data URI
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


# ------------------------------------------------------------------
# Order & OrderItem
# ------------------------------------------------------------------
class OrderModel(models.Model):
    """Maps to the ``orders`` table."""

    STATUS_CHOICES = [
        ("Completed", "Completed"),
        ("Pending", "Pending"),
        ("Cancelled", "Cancelled"),
    ]

    order_id = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=200)
    date = models.DateTimeField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.order_id} — {self.customer_name}"


class OrderItemModel(models.Model):
    """Maps to the ``order_items`` table."""

    order = models.ForeignKey(
        OrderModel, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        ProductModel, on_delete=models.SET_NULL, null=True, blank=True
    )
    product_name = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_items"

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


# ------------------------------------------------------------------
# Sale & SaleItem  (POS transactions)
# ------------------------------------------------------------------
class SaleModel(models.Model):
    """Maps to the ``sales`` table. Each row is a completed POS transaction."""

    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Card", "Card"),
        ("GCash", "GCash"),
        ("Maya", "Maya"),
    ]

    STATUS_CHOICES = [
        ("Completed", "Completed"),
        ("Pending", "Pending"),
        ("Cancelled", "Cancelled"),
    ]

    sale_id = models.CharField(max_length=50, unique=True)
    # Receipt / customer identification
    receipt_number = models.CharField(max_length=30, unique=True, null=True, blank=True)
    customer_number = models.CharField(max_length=20, blank=True, default="")
    cashier_name = models.CharField(max_length=200, blank=True, default="")
    order_type = models.CharField(max_length=20, blank=True, default="Dine In")
    # Customer info
    customer_name = models.CharField(max_length=200)
    table_number = models.CharField(max_length=50, blank=True, default="")
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_CHOICES, default="Cash"
    )
    # Financials
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_tendered = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    change_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sales"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.receipt_number or self.sale_id} — {self.customer_name}"


class SaleItemModel(models.Model):
    """Maps to the ``sale_items`` table. One row per line-item in a sale."""

    sale = models.ForeignKey(
        SaleModel, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        ProductModel, on_delete=models.SET_NULL, null=True, blank=True
    )
    product_name = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # for COGS
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # quantity × unit_price

    class Meta:
        db_table = "sale_items"

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


# ------------------------------------------------------------------
# Inventory Transaction
# ------------------------------------------------------------------
class InventoryTransactionModel(models.Model):
    """Maps to the ``inventory_transactions`` table."""

    TRANSACTION_TYPES = [
        ("stock_in", "Stock In"),
        ("stock_out", "Stock Out"),
        ("adjustment", "Adjustment"),
        ("return", "Return"),
    ]

    product = models.ForeignKey(
        ProductModel, on_delete=models.CASCADE, related_name="transactions"
    )
    product_name = models.CharField(max_length=200)
    quantity_change = models.IntegerField()
    transaction_type = models.CharField(
        max_length=20, choices=TRANSACTION_TYPES, default="adjustment"
    )
    reference = models.CharField(max_length=100, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inventory_transactions"
        ordering = ["-timestamp"]

    def __str__(self):
        sign = "+" if self.quantity_change > 0 else ""
        return f"{self.product_name}: {sign}{self.quantity_change}"
