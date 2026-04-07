"""
Product data-transfer objects used between the API, service, and infrastructure layers.
"""


class ProductDTO:
    """Full representation of a product — used for read responses."""

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
        stock_status="",
        created_at=None,
        updated_at=None,
        supplier_name="",
        supplier_contact="",
        is_orderable=True,
    ):
        self.id = id
        self.name = name
        self.category = category
        self.price = price
        self.cost = cost
        self.stock = stock
        self.unit = unit
        self.description = description
        self.low_stock_threshold = low_stock_threshold
        self.image_url = image_url
        self.stock_status = stock_status
        self.created_at = created_at
        self.updated_at = updated_at
        self.supplier_name = supplier_name
        self.supplier_contact = supplier_contact
        self.is_orderable = is_orderable

    @property
    def can_order(self):
        """Return True if product can be ordered (stock > 0)."""
        return self.stock > 0

    @staticmethod
    def from_entity(entity):
        return ProductDTO(
            id=entity.id,
            name=entity.name,
            category=entity.category,
            price=entity.price,
            cost=entity.cost,
            stock=entity.stock,
            unit=entity.unit,
            description=entity.description,
            low_stock_threshold=entity.low_stock_threshold,
            image_url=entity.image_url,
            stock_status=entity.stock_status,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            supplier_name=getattr(entity, "supplier_name", ""),
            supplier_contact=getattr(entity, "supplier_contact", ""),
            is_orderable=getattr(entity, "is_orderable", True),
        )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "price": str(self.price),
            "cost": str(self.cost),
            "stock": self.stock,
            "unit": self.unit,
            "description": self.description,
            "low_stock_threshold": self.low_stock_threshold,
            "image_url": self.image_url,
            "stock_status": self.stock_status,
            "created_at": str(self.created_at) if self.created_at else None,
            "updated_at": str(self.updated_at) if self.updated_at else None,
            "supplier_name": self.supplier_name,
            "supplier_contact": self.supplier_contact,
            "is_orderable": self.is_orderable,
            "can_order": self.can_order,
        }

    def to_dict_compact(self):
        """Lightweight dict for list views — excludes base64 image_url (~200KB each).
        Use to_dict() for detail views where full image data is needed.
        """
        # Only include image_url if it's a URL (not base64 data URI)
        img = self.image_url
        if img and str(img).startswith("data:"):
            img = None  # Strip base64 from list response
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "price": str(self.price),
            "cost": str(self.cost),
            "stock": self.stock,
            "unit": self.unit,
            "description": self.description,
            "low_stock_threshold": self.low_stock_threshold,
            "image_url": img,
            "stock_status": self.stock_status,
            "created_at": str(self.created_at) if self.created_at else None,
            "updated_at": str(self.updated_at) if self.updated_at else None,
            "supplier_name": self.supplier_name,
            "supplier_contact": self.supplier_contact,
            "is_orderable": self.is_orderable,
            "can_order": self.can_order,
        }


class CreateProductDTO:
    """Payload for creating a new product."""

    def __init__(
        self,
        name,
        category,
        price,
        cost=0,
        stock=0,
        unit="piece",
        description="",
        low_stock_threshold=10,
        image_url=None,
    ):
        self.name = name
        self.category = category
        self.price = float(price)
        self.cost = float(cost)
        self.stock = int(stock)
        self.unit = unit
        self.description = description
        self.low_stock_threshold = int(low_stock_threshold)
        self.image_url = image_url


class UpdateProductDTO:
    """Payload for updating an existing product (all fields optional)."""

    def __init__(self, **kwargs):
        self.name = kwargs.get("name")
        self.category = kwargs.get("category")
        self.price = kwargs.get("price")
        self.cost = kwargs.get("cost")
        self.stock = kwargs.get("stock")
        self.unit = kwargs.get("unit")
        self.description = kwargs.get("description")
        self.low_stock_threshold = kwargs.get("low_stock_threshold")
        self.image_url = kwargs.get("image_url")
