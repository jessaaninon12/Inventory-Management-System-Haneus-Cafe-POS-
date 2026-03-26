"""
Product API controllers — thin HTTP layer.
All business logic lives in the service; controllers only handle
request parsing and response formatting.
"""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.schema_serializers import (
    CreateProductRequestSchema,
    ErrorSchema,
    ProductResponseSchema,
    UpdateProductRequestSchema,
)
from application.dtos.product_dto import CreateProductDTO, UpdateProductDTO
from application.services.product_service import ProductService
from infrastructure.repositories.product_repository import ProductRepository


def _get_service():
    return ProductService(ProductRepository())


class ProductListCreateController(APIView):
    """
    GET  /api/products/      → list all products (supports ?page=N&limit=M for pagination)
    POST /api/products/      → create a new product
    """

    @extend_schema(tags=["Products"], responses=ProductResponseSchema(many=True))
    def get(self, request):
        service = _get_service()
        # Check if pagination is requested
        page_param = request.query_params.get("page")
        limit_param = request.query_params.get("limit")
        
        if page_param or limit_param:
            try:
                page = int(page_param or 1)
                limit = int(limit_param or 30)
                page = max(page, 1)
                limit = min(max(limit, 1), 100)  # Cap at 100 items per page
            except (TypeError, ValueError):
                return Response(
                    {"error": "Invalid pagination parameters."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            result = service.get_products_paginated(page=page, limit=limit)
            return Response({
                "products": [p.to_dict() for p in result["products"]],
                "total_count": result["total_count"],
                "page": result["page"],
                "limit": result["limit"],
                "total_pages": result["total_pages"],
            })
        else:
            products = service.get_all_products()
            return Response([p.to_dict() for p in products])

    @extend_schema(
        tags=["Products"],
        request=CreateProductRequestSchema,
        responses={201: ProductResponseSchema, 400: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        try:
            dto = CreateProductDTO(
                name=request.data.get("name", ""),
                category=request.data.get("category", ""),
                price=request.data.get("price", 0),
                cost=request.data.get("cost", 0),
                stock=request.data.get("stock", 0),
                unit=request.data.get("unit", "piece"),
                description=request.data.get("description", ""),
                low_stock_threshold=request.data.get("low_stock_threshold", 10),
                image_url=request.data.get("image_url"),
            )
            product = service.create_product(dto)
            return Response(product.to_dict(), status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {"errors": e.args[0]}, status=status.HTTP_400_BAD_REQUEST
            )


class ProductDetailController(APIView):
    """
    GET    /api/products/<pk>/  → retrieve
    PUT    /api/products/<pk>/  → update
    DELETE /api/products/<pk>/  → delete
    """

    @extend_schema(tags=["Products"], responses={200: ProductResponseSchema, 404: ErrorSchema})
    def get(self, request, pk):
        service = _get_service()
        product = service.get_product(pk)
        if product is None:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(product.to_dict())

    @extend_schema(
        tags=["Products"],
        request=UpdateProductRequestSchema,
        responses={200: ProductResponseSchema, 400: ErrorSchema, 404: ErrorSchema},
    )
    def put(self, request, pk):
        service = _get_service()
        try:
            dto = UpdateProductDTO(**request.data)
            product = service.update_product(pk, dto)
            if product is None:
                return Response(
                    {"error": "Product not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(product.to_dict())
        except ValueError as e:
            return Response(
                {"errors": e.args[0]}, status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(tags=["Products"], responses={204: None, 404: ErrorSchema})
    def delete(self, request, pk):
        service = _get_service()
        deleted = service.delete_product(pk)
        if not deleted:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class LowStockController(APIView):
    """GET /api/products/low-stock/ → list products below threshold.
    Cached for 60 seconds since the notification badge polls this frequently.
    Cache is invalidated on any stock change via explicit delete in mutation views.
    """

    @extend_schema(tags=["Products"], responses=ProductResponseSchema(many=True))
    def get(self, request):
        from django.core.cache import cache
        cache_key = "products:low_stock"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        service = _get_service()
        products = service.get_low_stock_products()
        data = [p.to_dict() for p in products]
        cache.set(cache_key, data, timeout=60)
        return Response(data)


# ---------------------------------------------------------------------------
# New standardised endpoints  (v2 naming convention)
# ---------------------------------------------------------------------------

class ProductViewListController(APIView):
    """
    GET /api/products/view/  → list all products (supports ?page=N&limit=M for pagination)
    """

    @extend_schema(tags=["Products v2"], responses=ProductResponseSchema(many=True))
    def get(self, request):
        service = _get_service()
        page_param = request.query_params.get("page")
        limit_param = request.query_params.get("limit")

        if page_param or limit_param:
            try:
                page = int(page_param or 1)
                limit = int(limit_param or 30)
                page = max(page, 1)
                limit = min(max(limit, 1), 100)
            except (TypeError, ValueError):
                return Response(
                    {"error": "Invalid pagination parameters."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            result = service.get_products_paginated(page=page, limit=limit)
            return Response({
                "products": [p.to_dict() for p in result["products"]],
                "total_count": result["total_count"],
                "page": result["page"],
                "limit": result["limit"],
                "total_pages": result["total_pages"],
            })
        products = service.get_all_products()
        return Response([p.to_dict() for p in products])


class ProductViewDetailController(APIView):
    """
    GET /api/products/view/<pk>/  → retrieve a single product
    """

    @extend_schema(tags=["Products v2"], responses={200: ProductResponseSchema, 404: ErrorSchema})
    def get(self, request, pk):
        service = _get_service()
        product = service.get_product(pk)
        if product is None:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(product.to_dict())


class ProductCreateController(APIView):
    """
    POST /api/products/create/  → create a new product
    """

    @extend_schema(
        tags=["Products v2"],
        request=CreateProductRequestSchema,
        responses={201: ProductResponseSchema, 400: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        try:
            dto = CreateProductDTO(
                name=request.data.get("name", ""),
                category=request.data.get("category", ""),
                price=request.data.get("price", 0),
                cost=request.data.get("cost", 0),
                stock=request.data.get("stock", 0),
                unit=request.data.get("unit", "piece"),
                description=request.data.get("description", ""),
                low_stock_threshold=request.data.get("low_stock_threshold", 10),
                image_url=request.data.get("image_url"),
            )
            product = service.create_product(dto)
            return Response(product.to_dict(), status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"errors": e.args[0]}, status=status.HTTP_400_BAD_REQUEST)


class ProductEditController(APIView):
    """
    PUT /api/products/edit/<pk>/  → full update
    """

    @extend_schema(
        tags=["Products v2"],
        request=UpdateProductRequestSchema,
        responses={200: ProductResponseSchema, 400: ErrorSchema, 404: ErrorSchema},
    )
    def put(self, request, pk):
        service = _get_service()
        try:
            dto = UpdateProductDTO(**request.data)
            product = service.update_product(pk, dto)
            if product is None:
                return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response(product.to_dict())
        except ValueError as e:
            return Response({"errors": e.args[0]}, status=status.HTTP_400_BAD_REQUEST)


class ProductDeleteController(APIView):
    """
    DELETE /api/products/delete/<pk>/  → remove a product
    """

    @extend_schema(tags=["Products v2"], responses={204: None, 404: ErrorSchema})
    def delete(self, request, pk):
        service = _get_service()
        deleted = service.delete_product(pk)
        if not deleted:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductPartialEditController(APIView):
    """
    PATCH /api/products/partialedit/<pk>/  → partial update (only supplied fields)
    """

    @extend_schema(
        tags=["Products v2"],
        request=UpdateProductRequestSchema,
        responses={200: ProductResponseSchema, 400: ErrorSchema, 404: ErrorSchema},
    )
    def patch(self, request, pk):
        service = _get_service()
        try:
            dto = UpdateProductDTO(**request.data)
            product = service.update_product(pk, dto)
            if product is None:
                return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response(product.to_dict())
        except ValueError as e:
            return Response({"errors": e.args[0]}, status=status.HTTP_400_BAD_REQUEST)
