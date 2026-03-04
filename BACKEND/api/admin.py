from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Product, Sale, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Admin interface for the custom User model (stored in 'users' table)."""
    pass


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "price", "stock", "stock_status", "updated_at"]
    list_filter = ["category"]
    search_fields = ["name", "description"]


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ["order_id", "customer_name", "total", "status", "date"]
    list_filter = ["status"]
    search_fields = ["order_id", "customer_name"]
