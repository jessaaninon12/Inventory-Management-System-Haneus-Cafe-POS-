"""
Product application service — orchestrates business logic.
Depends only on domain entities, DTOs, and the repository interface.
"""

from domain.entities.product import Product
from application.dtos.product_dto import ProductDTO
from application.interfaces.product_repository_interface import (
    ProductRepositoryInterface,
)


class ProductService:

    def __init__(self, repository: ProductRepositoryInterface):
        self.repository = repository

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_all_products(self):
        """Return a list of ProductDTO for every product."""
        entities = self.repository.get_all()
        return [ProductDTO.from_entity(e) for e in entities]

    def get_product(self, product_id):
        """Return a single ProductDTO or None."""
        entity = self.repository.get_by_id(product_id)
        if entity is None:
            return None
        return ProductDTO.from_entity(entity)

    def get_low_stock_products(self):
        """Return ProductDTOs where stock <= threshold."""
        entities = self.repository.get_low_stock()
        return [ProductDTO.from_entity(e) for e in entities]

    def get_products_paginated(self, page=1, limit=30):
        """Return paginated ProductDTOs with metadata."""
        offset = max(page - 1, 0) * limit
        entities = self.repository.get_paginated(offset=offset, limit=limit)
        total_count = self.repository.get_total_count()
        total_pages = (total_count + limit - 1) // limit if limit else 0
        return {
            "products": [ProductDTO.from_entity(e) for e in entities],
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        }

    def get_products_paginated(self, page=1, limit=30):
        """Return paginated ProductDTOs with metadata."""
        offset = max(page - 1, 0) * limit
        entities = self.repository.get_paginated(offset=offset, limit=limit)
        total_count = self.repository.get_total_count()
        total_pages = (total_count + limit - 1) // limit if limit else 0
        return {
            "products": [ProductDTO.from_entity(e) for e in entities],
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        }

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create_product(self, dto):
        """Validate and persist a new product. Returns ProductDTO."""
        entity = Product(
            name=dto.name,
            category=dto.category,
            price=dto.price,
            cost=dto.cost,
            stock=dto.stock,
            unit=dto.unit,
            description=dto.description,
            low_stock_threshold=dto.low_stock_threshold,
            image_url=dto.image_url,
        )
        errors = entity.validate()
        if errors:
            raise ValueError(errors)
        saved = self.repository.create(entity)
        return ProductDTO.from_entity(saved)

    def update_product(self, product_id, dto):
        """Partially update a product. Returns ProductDTO or None."""
        entity = self.repository.get_by_id(product_id)
        if entity is None:
            return None

        # Apply only the fields that were provided
        if dto.name is not None:
            entity.name = dto.name
        if dto.category is not None:
            entity.category = dto.category
        if dto.price is not None:
            entity.price = float(dto.price)
        if dto.cost is not None:
            entity.cost = float(dto.cost)
        if dto.stock is not None:
            entity.stock = int(dto.stock)
        if dto.unit is not None:
            entity.unit = dto.unit
        if dto.description is not None:
            entity.description = dto.description
        if dto.low_stock_threshold is not None:
            entity.low_stock_threshold = int(dto.low_stock_threshold)
        if dto.image_url is not None:
            entity.image_url = dto.image_url

        errors = entity.validate()
        if errors:
            raise ValueError(errors)

        saved = self.repository.update(entity)
        return ProductDTO.from_entity(saved)

    def delete_product(self, product_id):
        """Delete a product. Returns True on success, False if not found."""
        return self.repository.delete(product_id)
