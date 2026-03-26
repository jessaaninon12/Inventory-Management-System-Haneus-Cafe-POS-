"""
Inventory repository — concrete implementation using Django ORM.
"""

from django.db.models import F

from application.interfaces.inventory_repository_interface import (
    InventoryRepositoryInterface,
)
from domain.entities.inventory import InventoryItem, InventoryTransaction
from infrastructure.data.models import InventoryTransactionModel, ProductModel


class InventoryRepository(InventoryRepositoryInterface):

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_transactions_by_product(self, product_id):
        # select_related('product') avoids N+1 if product fields are accessed
        qs = InventoryTransactionModel.objects.select_related("product").filter(
            product_id=product_id
        ).order_by("-timestamp")
        return [self._txn_to_entity(m) for m in qs]

    def get_low_stock_items(self):
        qs = ProductModel.objects.filter(
            stock__lte=F("low_stock_threshold")
        ).only("id", "name", "stock", "unit", "low_stock_threshold").order_by("stock")
        return [self._product_to_inventory_item(m) for m in qs]

    def get_inventory_summary(self):
        return [
            self._product_to_inventory_item(m)
            for m in ProductModel.objects.only(
                "id", "name", "stock", "unit", "low_stock_threshold"
            )
        ]

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create_transaction(self, transaction: InventoryTransaction):
        m = InventoryTransactionModel.objects.create(
            product_id=transaction.product_id,
            product_name=transaction.product_name,
            quantity_change=transaction.quantity_change,
            transaction_type=transaction.transaction_type,
            reference=transaction.reference,
            notes=transaction.notes,
        )
        return self._txn_to_entity(m)

    # ------------------------------------------------------------------
    # Mapping
    # ------------------------------------------------------------------

    @staticmethod
    def _txn_to_entity(m: InventoryTransactionModel) -> InventoryTransaction:
        return InventoryTransaction(
            id=m.pk,
            product_id=m.product_id,
            product_name=m.product_name,
            quantity_change=m.quantity_change,
            transaction_type=m.transaction_type,
            reference=m.reference,
            notes=m.notes,
            timestamp=m.timestamp,
        )

    @staticmethod
    def _product_to_inventory_item(m: ProductModel) -> InventoryItem:
        return InventoryItem(
            product_id=m.pk,
            product_name=m.name,
            current_stock=m.stock,
            unit=m.unit,
            low_stock_threshold=m.low_stock_threshold,
        )
