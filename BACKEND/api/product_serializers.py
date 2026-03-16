"""
Product serializers — DRF serializers for product and sale models.
Used by the legacy api/views.py generic views.
"""

from rest_framework import serializers

from .models import Product, Sale


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class ProductSerializer(serializers.ModelSerializer):
    """
    Full product representation.
    stock_status is a read-only computed property on the model
    (returns 'In Stock', 'Low Stock', or 'Out of Stock').
    """

    stock_status = serializers.ReadOnlyField()

    class Meta:
        model  = Product
        fields = [
            "id",
            "name",
            "category",
            "price",
            "cost",
            "stock",
            "unit",
            "description",
            "low_stock_threshold",
            "image_url",
            "stock_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# Sale
# ---------------------------------------------------------------------------

class SaleSerializer(serializers.ModelSerializer):
    """Legacy sale / order record serializer."""

    class Meta:
        model  = Sale
        fields = [
            "id",
            "order_id",
            "customer_name",
            "date",
            "total",
            "status",
            "items_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
