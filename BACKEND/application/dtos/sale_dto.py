"""
Sale data-transfer objects used between the API, service, and infrastructure layers.
"""


class SaleItemDTO:
    """Single line-item within a sale response."""

    def __init__(
        self,
        id=None,
        product_id=None,
        product_name="",
        quantity=1,
        unit_price=0.0,
        cost_price=0.0,
        subtotal=0.0,
    ):
        self.id = id
        self.product_id = product_id
        self.product_name = product_name
        self.quantity = quantity
        self.unit_price = unit_price
        self.cost_price = cost_price
        self.subtotal = subtotal

    @staticmethod
    def from_entity(entity):
        return SaleItemDTO(
            id=entity.id,
            product_id=entity.product_id,
            product_name=entity.product_name,
            quantity=entity.quantity,
            unit_price=entity.unit_price,
            cost_price=entity.cost_price,
            subtotal=entity.subtotal,
        )

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "quantity": self.quantity,
            "unit_price": str(self.unit_price),
            "cost_price": str(self.cost_price),
            "subtotal": str(self.subtotal),
            "total": str(self.subtotal),  # alias for clarity
        }


class SaleDTO:
    """Full representation of a POS sale — used for read responses."""

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
        items_count=0,
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
        self.subtotal = subtotal
        self.discount = discount
        self.tax = tax
        self.total = total
        self.amount_tendered = amount_tendered
        self.change_amount = change_amount
        self.status = status
        self.items_count = items_count
        self.items = items or []
        self.created_at = created_at
        self.updated_at = updated_at

    @staticmethod
    def from_entity(entity):
        return SaleDTO(
            id=entity.id,
            sale_id=entity.sale_id,
            receipt_number=entity.receipt_number,
            customer_number=entity.customer_number,
            cashier_name=entity.cashier_name,
            order_type=entity.order_type,
            customer_name=entity.customer_name,
            table_number=entity.table_number,
            payment_method=entity.payment_method,
            subtotal=entity.subtotal,
            discount=entity.discount,
            tax=entity.tax,
            total=entity.total,
            amount_tendered=entity.amount_tendered,
            change_amount=entity.change_amount,
            status=entity.status,
            items_count=entity.items_count,
            items=[SaleItemDTO.from_entity(i) for i in entity.items],
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def to_dict(self):
        return {
            "id": self.id,
            "sale_id": self.sale_id,
            "receipt_number": self.receipt_number,
            "customer_number": self.customer_number,
            "cashier_name": self.cashier_name,
            "order_type": self.order_type,
            "customer_name": self.customer_name,
            "table_number": self.table_number,
            "payment_method": self.payment_method,
            "subtotal": str(self.subtotal),
            "discount": str(self.discount),
            "tax": str(self.tax),
            "total": str(self.total),
            "amount_tendered": str(self.amount_tendered),
            "change_amount": str(self.change_amount),
            "status": self.status,
            "items_count": self.items_count,
            "items": [i.to_dict() for i in self.items],
            "created_at": str(self.created_at) if self.created_at else None,
            "updated_at": str(self.updated_at) if self.updated_at else None,
        }


class CreateSaleDTO:
    """Payload for creating a new POS sale (checkout)."""

    def __init__(
        self,
        sale_id,
        customer_name,
        table_number="",
        order_type="Dine In",
        cashier_name="",
        payment_method="Cash",
        subtotal=0.0,
        discount=0.0,
        tax=0.0,
        total=0.0,
        amount_tendered=0.0,
        change_amount=0.0,
        status="Completed",
        items=None,
    ):
        self.sale_id = sale_id
        self.customer_name = customer_name
        self.table_number = table_number
        self.order_type = order_type
        self.cashier_name = cashier_name
        self.payment_method = payment_method
        self.subtotal = float(subtotal)
        self.discount = float(discount)
        self.tax = float(tax)
        self.total = float(total)
        self.amount_tendered = float(amount_tendered)
        self.change_amount = float(change_amount)
        self.status = status
        # list of dicts: {product_id, product_name, quantity, unit_price, cost_price}
        self.items = items or []


class UpdateSaleDTO:
    """Payload for updating an existing sale (full or partial)."""

    def __init__(self, **kwargs):
        self.customer_name = kwargs.get("customer_name")
        self.table_number = kwargs.get("table_number")
        self.payment_method = kwargs.get("payment_method")
        self.status = kwargs.get("status")
