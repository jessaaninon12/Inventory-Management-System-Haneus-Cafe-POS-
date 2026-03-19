from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model — stored in the 'users' table."""

    USER_TYPE_CHOICES = [
        ("Admin", "Admin"),
        ("Staff", "Staff"),
    ]

    phone = models.CharField(max_length=30, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    avatar_url = models.CharField(max_length=500, blank=True, default="")
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default="Staff",
    )

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.username


class Product(models.Model):
    """Inventory product — mirrors the frontend Product type."""

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
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    @property
    def stock_status(self):
        if self.stock <= 0:
            return "Out of Stock"
        if self.stock <= self.low_stock_threshold:
            return "Low Stock"
        return "In Stock"


class Sale(models.Model):
    """Sales / order record — mirrors the frontend Sale type."""

    STATUS_CHOICES = [
        ("Completed", "Completed"),
        ("Pending", "Pending"),
        ("Cancelled", "Cancelled"),
    ]

    order_id = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=200)
    date = models.DateTimeField()
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    items_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.order_id} — {self.customer_name}"
