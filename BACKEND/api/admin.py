from django.contrib import admin

from .models import Product, Sale


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
