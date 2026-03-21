"""
Sale domain entity — pure business logic, no framework dependencies.
"""

from datetime import datetime


class SaleItem:
    """Represents a single line-item within a POS sale."""

    def __init__(
        self,
        id=None,
        sale_id=None,
        product_id=None,
        product_name="",
        quantity=1,
        unit_price=0.0,
        cost_price=0.0,
    ):
        self.id = id
        self.sale_id = sale_id
        self.product_id = product_id
        self.product_name = product_name
        self.quantity = int(quantity)
        self.unit_price = float(unit_price)
        self.cost_price = float(cost_price)  # used for COGS calculation

    @property
    def subtotal(self):
        return round(self.quantity * self.unit_price, 2)

    # Alias so repositories can store the computed total easily
    @property
    def total(self):
        return self.subtotal

    def validate(self):
        errors = []
        if self.quantity <= 0:
            errors.append("Quantity must be greater than zero.")
        if self.unit_price < 0:
            errors.append("Unit price cannot be negative.")
        return errors

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"

    def __repr__(self):
        return f"SaleItem(product={self.product_name}, qty={self.quantity})"


class Sale:
    """Represents a POS sale / transaction."""

    STATUS_CHOICES = ["Completed", "Pending", "Cancelled"]
    PAYMENT_CHOICES = ["Cash", "Card", "GCash", "Maya"]
    TAX_RATE = 0.12  # 12% VAT exclusive — consistent with frontend pos.js

    def __init__(
        self,
        id=None,
        sale_id="",
        receipt_number=None,
        customer_number="",
        cashier_name="",
        order_type="Dine In",
        customer_name="",
        table_number="",
        payment_method="Cash",
        subtotal=0.0,
        discount=0.0,
        tax=0.0,
        total=0.0,
        amount_tendered=0.0,
        change_amount=0.0,
        status="Pending",
        items=None,
        created_at=None,
        updated_at=None,
    ):
        self.id = id
        self.sale_id = sale_id
        self.receipt_number = receipt_number
        self.customer_number = customer_number
        self.cashier_name = cashier_name
        self.order_type = order_type
        self.customer_name = customer_name
        self.table_number = table_number
        self.payment_method = payment_method
        self.subtotal = float(subtotal)
        self.discount = float(discount)
        self.tax = float(tax)
        self.total = float(total)
        self.amount_tendered = float(amount_tendered)
        self.change_amount = float(change_amount)
        self.status = status
        self.items = items or []
        self.created_at = created_at
        self.updated_at = updated_at

    # ------------------------------------------------------------------
    # Computed properties
    # ------------------------------------------------------------------

    @property
    def items_count(self):
        return len(self.items)

    # ------------------------------------------------------------------
    # Business rules
    # ------------------------------------------------------------------

    def can_cancel(self):
        return self.status == "Pending"

    def cancel(self):
        if not self.can_cancel():
            raise ValueError("Only pending sales can be cancelled.")
        self.status = "Cancelled"

    def complete(self):
        if self.status != "Pending":
            raise ValueError("Only pending sales can be completed.")
        self.status = "Completed"

    def validate(self):
        errors = []
        if not self.sale_id:
            errors.append("Sale ID is required.")
        if not self.customer_name:
            errors.append("Customer name is required.")
        if self.status not in self.STATUS_CHOICES:
            errors.append(f"Invalid status: {self.status}")
        if self.payment_method not in self.PAYMENT_CHOICES:
            errors.append(f"Invalid payment method: {self.payment_method}")
        if not self.items:
            errors.append("Sale must have at least one item.")
        for item in self.items:
            errors.extend(item.validate())
        return errors

    # ------------------------------------------------------------------
    # Formulas (class-level helpers)
    # ------------------------------------------------------------------

    @classmethod
    def compute_totals(cls, items, discount_rate=0.0, cash_tendered=0.0):
        """
        Compute all POS checkout formulas from a list of item dicts.

        VAT is EXCLUSIVE (12%):
          subtotal      = Σ (quantity × unit_price)
          discount      = subtotal × discount_rate
          taxable       = subtotal − discount
          vat           = taxable × 0.12
          total         = taxable + vat  (= subtotal − discount + vat)
          change        = cash_tendered − total  (0 if non-cash)
          cogs          = Σ (quantity × cost_price)
          gross_profit  = subtotal − COGS

        Each item must have: quantity (int), unit_price (float), cost_price (float, optional).
        """
        subtotal = round(
            sum(
                int(i.get("quantity", 1)) * float(i.get("unit_price", 0))
                for i in items
            ),
            2,
        )
        discount_rate   = float(discount_rate or 0)
        discount_amount = round(subtotal * discount_rate, 2)
        taxable         = round(subtotal - discount_amount, 2)
        vat             = round(taxable * cls.TAX_RATE, 2)
        total           = round(taxable + vat, 2)

        cash_tendered = float(cash_tendered or 0)
        change = round(cash_tendered - total, 2) if cash_tendered > 0 else 0.0

        cogs = round(
            sum(
                int(i.get("quantity", 1)) * float(i.get("cost_price", 0))
                for i in items
            ),
            2,
        )
        gross_profit     = round(subtotal - cogs, 2)
        total_units_sold = sum(int(i.get("quantity", 1)) for i in items)

        return {
            "subtotal":         subtotal,
            "discount":         discount_amount,
            "taxable":          taxable,
            "tax":              vat,
            "total":            total,
            "tax_rate":         cls.TAX_RATE,
            "change":           change,
            "cogs":             cogs,
            "gross_profit":     gross_profit,
            "total_units_sold": total_units_sold,
        }

    def __str__(self):
        return f"{self.sale_id} — {self.customer_name}"

    def __repr__(self):
        return f"Sale(id={self.sale_id}, status={self.status})"
