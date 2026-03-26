"""
Product repository — concrete implementation using Django ORM.
Implements the contract defined in application.interfaces.
"""

from django.db.models import F

from application.interfaces.product_repository_interface import (
    ProductRepositoryInterface,
)
from domain.entities.product import Product
from infrastructure.data.models import ProductModel


class ProductRepository(ProductRepositoryInterface):

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_all(self):
        return [self._to_entity(m) for m in ProductModel.objects.all()]

    def get_by_id(self, product_id):
        try:
            return self._to_entity(ProductModel.objects.get(pk=product_id))
        except ProductModel.DoesNotExist:
            return None

    def get_low_stock(self):
        """Get products with stock <= threshold, optimized for dashboard."""
        qs = ProductModel.objects.filter(stock__lte=F("low_stock_threshold")).order_by("stock")
        return [self._to_entity(m) for m in qs]

    def get_paginated(self, offset=0, limit=30):
        """Return paginated results with offset and limit. Use offset limit pattern for consistency."""
        qs = ProductModel.objects.all().order_by("id")[offset : offset + limit]
        return [self._to_entity(m) for m in qs]

    def get_total_count(self):
        """Return total count of products for pagination metadata."""
        return ProductModel.objects.count()

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create(self, product: Product):
        m = ProductModel.objects.create(**self._to_model_data(product))
        return self._to_entity(m)

    def update(self, product: Product):
        ProductModel.objects.filter(pk=product.id).update(
            **self._to_model_data(product)
        )
        return self.get_by_id(product.id)

    def delete(self, product_id, deleted_by_id=None):
        """Delete a product, backing up full data first. Returns True on success."""
        try:
            m = ProductModel.objects.get(pk=product_id)
        except ProductModel.DoesNotExist:
            return False

        # --- Backup record before deletion ---
        try:
            from api.models import DeletedRecordsBackup
            DeletedRecordsBackup.objects.create(
                record_type="product",
                original_id=m.pk,
                data={
                    "id": m.pk,
                    "name": m.name,
                    "category": m.category,
                    "price": str(m.price),
                    "cost": str(m.cost),
                    "stock": m.stock,
                    "unit": m.unit,
                    "description": m.description,
                    "low_stock_threshold": m.low_stock_threshold,
                    "supplier_name": getattr(m, "supplier_name", ""),
                    "supplier_contact": getattr(m, "supplier_contact", ""),
                    "image_url": str(m.image_url) if m.image_url else "",
                    "created_at": str(m.created_at),
                    "updated_at": str(m.updated_at),
                },
                deleted_by_id=deleted_by_id,
            )
        except Exception:
            pass  # Backup failure must not block deletion

        m.delete()
        return True

    # ------------------------------------------------------------------
    # Mapping helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_entity(m: ProductModel) -> Product:
        entity = Product(
            id=m.pk,
            name=m.name,
            category=m.category,
            price=float(m.price),
            cost=float(m.cost),
            stock=m.stock,
            unit=m.unit,
            description=m.description,
            low_stock_threshold=m.low_stock_threshold,
            image_url=m.image_url,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )
        entity.supplier_name = getattr(m, "supplier_name", "")
        entity.supplier_contact = getattr(m, "supplier_contact", "")
        entity.is_orderable = getattr(m, "is_orderable", True)
        return entity

    @staticmethod
    def _to_model_data(entity: Product) -> dict:
        data = {
            "name": entity.name,
            "category": entity.category,
            "price": entity.price,
            "cost": entity.cost,
            "stock": entity.stock,
            "unit": entity.unit,
            "description": entity.description,
            "low_stock_threshold": entity.low_stock_threshold,
            "image_url": entity.image_url,
        }
        if hasattr(entity, "supplier_name"):
            data["supplier_name"] = entity.supplier_name
        if hasattr(entity, "supplier_contact"):
            data["supplier_contact"] = entity.supplier_contact
        if hasattr(entity, "is_orderable"):
            data["is_orderable"] = entity.is_orderable
        return data
