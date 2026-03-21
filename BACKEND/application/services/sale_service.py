"""
Sale application service — orchestrates POS business logic.
Depends only on domain entities, DTOs, and the repository interface.
"""

import random
from datetime import date

from domain.entities.sale import Sale, SaleItem
from application.dtos.sale_dto import SaleDTO
from application.interfaces.sale_repository_interface import SaleRepositoryInterface


# ------------------------------------------------------------------
# Receipt / customer number generators
# ------------------------------------------------------------------

def _generate_receipt_number(today_count: int) -> str:
    """
    Format: REC-YYYYMMDD-XXXX
    Sequence is today_count + 1, zero-padded to 4 digits.
    Example: REC-20260321-0001
    """
    date_str = date.today().strftime("%Y%m%d")
    seq = str(today_count + 1).zfill(4)
    return f"REC-{date_str}-{seq}"


def _generate_customer_number() -> str:
    """Returns CUST-XXXXXX with a random 6-digit suffix."""
    return "CUST-" + str(random.randint(100000, 999999))


class SaleService:

    def __init__(self, repository: SaleRepositoryInterface):
        # Primary persistence for sales (create, update, read, delete)
        self.repository = repository

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_all_sales(self):
        """Fetch all sale entities from the repository and convert to DTOs."""
        entities = self.repository.get_all()
        return [SaleDTO.from_entity(e) for e in entities]

    def get_sale(self, pk):
        """Retrieve a single sale; return None if it does not exist."""
        entity = self.repository.get_by_id(pk)
        if entity is None:
            return None
        return SaleDTO.from_entity(entity)

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create_sale(self, dto):
        """Build a Sale entity from the DTO, generate receipt/customer numbers, validate, and persist."""
        # Generate unique receipt number using today's count
        today_count = self.repository.get_today_count()
        receipt_number = _generate_receipt_number(today_count)
        customer_number = _generate_customer_number()

        # Map incoming item payloads to domain SaleItem entities
        items = [
            SaleItem(
                product_id=i.get("product_id"),
                product_name=i.get("product_name", ""),
                quantity=i.get("quantity", 1),
                unit_price=i.get("unit_price", 0),
                cost_price=i.get("cost_price", 0),
            )
            for i in dto.items
        ]
        # Assemble the Sale domain entity
        entity = Sale(
            sale_id=dto.sale_id,
            receipt_number=receipt_number,
            customer_number=customer_number,
            cashier_name=dto.cashier_name,
            order_type=dto.order_type,
            customer_name=dto.customer_name,
            table_number=dto.table_number,
            payment_method=dto.payment_method,
            subtotal=dto.subtotal,
            discount=dto.discount,
            tax=dto.tax,
            total=dto.total,
            amount_tendered=dto.amount_tendered,
            change_amount=dto.change_amount,
            status=dto.status,
            items=items,
        )
        # Run domain validation (ensures required fields and valid items)
        errors = entity.validate()
        if errors:
            raise ValueError(errors)
        # Persist via repository and return DTO representation
        saved = self.repository.create(entity)
        return SaleDTO.from_entity(saved)

    def update_sale(self, pk, dto):
        """Apply full or partial updates to an existing sale."""
        entity = self.repository.get_by_id(pk)
        if entity is None:
            return None

        # Apply updates only to provided (non-None) fields
        if dto.customer_name is not None:
            entity.customer_name = dto.customer_name
        if dto.table_number is not None:
            entity.table_number = dto.table_number
        if dto.payment_method is not None:
            entity.payment_method = dto.payment_method
        if dto.status is not None:
            entity.status = dto.status

        # Save and return the updated DTO
        saved = self.repository.update(entity)
        return SaleDTO.from_entity(saved)

    def delete_sale(self, pk):
        """Delete the sale by primary key; returns True if deleted."""
        return self.repository.delete(pk)

    def compute_totals(self, items, discount_rate=0.0, cash_tendered=0.0):
        """
        Compute all POS checkout formulas without persisting anything.

        VAT is EXCLUSIVE (12%):
          Subtotal      = Σ (quantity × unit_price)
          Discount      = Subtotal × discount_rate
          Taxable       = Subtotal − Discount
          VAT           = Taxable × 0.12
          Total         = Taxable + VAT
          Change        = CashTendered − Total  (0 if non-cash)
          COGS          = Σ (quantity × cost_price)
          GrossProfit   = Subtotal − COGS

        :param items:          list of dicts with quantity, unit_price, cost_price
        :param discount_rate:  float 0–1 (e.g. 0.20 for 20%)
        :param cash_tendered:  float, cash given by customer (optional)
        :returns:              dict with all computed values as strings
        """
        result = Sale.compute_totals(items, discount_rate, cash_tendered)
        # Return string representations for JSON-safe responses
        return {
            "subtotal":         str(result["subtotal"]),
            "discount":         str(result["discount"]),
            "taxable":          str(result["taxable"]),
            "tax":              str(result["tax"]),
            "total":            str(result["total"]),
            "tax_rate":         str(result["tax_rate"]),
            "change":           str(result["change"]),
            "cogs":             str(result["cogs"]),
            "gross_profit":     str(result["gross_profit"]),
            "total_units_sold": result["total_units_sold"],
        }
