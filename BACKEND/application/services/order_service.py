"""
Order application service — orchestrates business logic.
Depends only on domain entities, DTOs, and the repository interface.
"""

from typing import Optional

from domain.entities.order import Order, OrderItem
from domain.entities.inventory import InventoryTransaction
from application.dtos.order_dto import OrderDTO
from application.interfaces.order_repository_interface import OrderRepositoryInterface
from application.interfaces.inventory_repository_interface import InventoryRepositoryInterface
from application.interfaces.product_repository_interface import ProductRepositoryInterface


class OrderService:

    def __init__(
        self,
        repository: OrderRepositoryInterface,
        inventory_repository: Optional[InventoryRepositoryInterface] = None,
        product_repository: Optional[ProductRepositoryInterface] = None,
    ):
        # Primary persistence for orders (create, update, read, delete)
        self.repository = repository
        # Optional: repositories used for inventory side-effects when orders complete
        # If provided, we can deduct stock and write stock_out transactions per item
        self.inventory_repo = inventory_repository
        self.product_repo = product_repository

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_all_orders(self):
        # Fetch all order entities from the repository and convert to DTOs
        entities = self.repository.get_all()
        return [OrderDTO.from_entity(e) for e in entities]

    def get_order(self, pk):
        # Retrieve a single order; return None if it does not exist
        entity = self.repository.get_by_id(pk)
        if entity is None:
            return None
        return OrderDTO.from_entity(entity)

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create_order(self, dto):
        """Build an Order entity from the DTO, validate, and persist."""
        # Map incoming item payloads to domain OrderItem entities
        items = [
            OrderItem(
                product_id=i.get("product_id"),
                product_name=i.get("product_name", ""),
                quantity=i.get("quantity", 1),
                unit_price=i.get("unit_price", 0),
            )
            for i in dto.items
        ]
        # Assemble the Order domain entity
        entity = Order(
            order_id=dto.order_id,
            customer_name=dto.customer_name,
            date=dto.date,
            status=dto.status,
            items=items,
        )
        # Run domain validation (ensures required fields and valid items)
        errors = entity.validate()
        if errors:
            raise ValueError(errors)
        # Persist via repository and return DTO representation
        saved = self.repository.create(entity)
        return OrderDTO.from_entity(saved)

    def update_order(self, pk, dto):
        # Load the current order state
        entity = self.repository.get_by_id(pk)
        if entity is None:
            return None

        # Apply partial updates only to provided fields
        if dto.customer_name is not None:
            entity.customer_name = dto.customer_name
        if dto.status is not None:
            entity.status = dto.status
        if dto.date is not None:
            entity.date = dto.date

        # Save and return the updated DTO
        saved = self.repository.update(entity)
        return OrderDTO.from_entity(saved)

    def cancel_order(self, pk):
        """Apply business rule: only pending orders can be cancelled."""
        # Retrieve the order; bail if it doesn't exist
        entity = self.repository.get_by_id(pk)
        if entity is None:
            return None
        # Domain method enforces rule (raises if not Pending)
        entity.cancel()
        # Persist cancellation
        saved = self.repository.update(entity)
        return OrderDTO.from_entity(saved)

    def complete_order(self, pk):
        """Apply business rule: only pending orders can be completed."""
        # Retrieve the order; bail if missing
        entity = self.repository.get_by_id(pk)
        if entity is None:
            return None
        # Domain method enforces rule (raises if not Pending)
        entity.complete()
        # Persist status change first
        saved = self.repository.update(entity)

        # If inventory and product repositories are provided,
        # reflect the sale in inventory:
        #  - Deduct each item's quantity from its product stock
        #  - Record a stock_out transaction with an Order reference
        if self.inventory_repo and self.product_repo:
            for item in entity.items:
                # Load the product for this item; skip if not found
                product = self.product_repo.get_by_id(item.product_id)
                if product is None:
                    continue
                # Deduct sold quantity from on-hand stock (domain guards against negative)
                product.adjust_stock(-item.quantity)
                # Persist updated product stock
                self.product_repo.update(product)
                # Create and persist an inventory transaction describing the sale
                txn = InventoryTransaction(
                    product_id=product.id,
                    product_name=product.name,
                    quantity_change=-item.quantity,
                    transaction_type="stock_out",
                    reference=f"Order {entity.order_id}",
                    notes=f"Sold {item.quantity} x {item.product_name}",
                )
                self.inventory_repo.create_transaction(txn)
        # Return the completed order as a DTO
        return OrderDTO.from_entity(saved)

    def delete_order(self, pk):
        # Delete the order by primary key; returns True if deleted
        return self.repository.delete(pk)
