"""
Product domain entity — pure business logic, no framework dependencies.
"""


class Product:
    """Represents a product in the cafe inventory."""

    CATEGORY_CHOICES = [
        "Beverages",
        "Desserts",
        "Pastries",
        "Ingredients",
        "Merchandise",
    ]

    def __init__(
        self,
        id=None,
        name="",
        category="",
        price=0.0,
        cost=0.0,
        stock=0,
        unit="piece",
        description="",
        low_stock_threshold=10,
        image_url=None,
        created_at=None,
        updated_at=None,
    ):
        self.id = id
        self.name = name
        self.category = category
        self.price = float(price)
        self.cost = float(cost)
        self.stock = int(stock)
        self.unit = unit
        self.description = description
        self.low_stock_threshold = int(low_stock_threshold)
        self.image_url = image_url
        self.created_at = created_at
        self.updated_at = updated_at

    # ------------------------------------------------------------------
    # Business rules
    # ------------------------------------------------------------------

    @property
    def stock_status(self):
        if self.stock <= 0:
            return "Out of Stock"
        if self.stock <= self.low_stock_threshold:
            return "Low Stock"
        return "In Stock"

    @property
    def is_low_stock(self):
        return self.stock <= self.low_stock_threshold

    @property
    def profit_margin(self):
        """Return profit margin as a percentage."""
        if self.price <= 0:
            return 0.0
        return round(((self.price - self.cost) / self.price) * 100, 2)

    def adjust_stock(self, quantity_change):
        """Adjust stock by *quantity_change* (positive = add, negative = remove)."""
        new_stock = self.stock + quantity_change
        if new_stock < 0:
            raise ValueError("Stock cannot go below zero.")
        self.stock = new_stock

    def validate(self):
        """Return a list of validation error strings (empty == valid)."""
        errors = []
        if not self.name:
            errors.append("Product name is required.")
        if self.category not in self.CATEGORY_CHOICES:
            errors.append(f"Invalid category: {self.category}")
        if self.price < 0:
            errors.append("Price cannot be negative.")
        if self.cost > 0 and self.price <= self.cost:
            errors.append("Selling price must be greater than cost per unit.")
        if self.stock < 0:
            errors.append("Stock cannot be negative.")
        return errors

    # ------------------------------------------------------------------
    # Dunder helpers
    # ------------------------------------------------------------------

    def __str__(self):
        return f"{self.name} ({self.category})"

    def __repr__(self):
        return f"Product(id={self.id}, name='{self.name}')"
