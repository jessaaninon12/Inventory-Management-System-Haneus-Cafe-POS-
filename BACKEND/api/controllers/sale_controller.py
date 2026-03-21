"""
Sale API controllers — thin HTTP layer for POS operations.
Coordinates HTTP requests and delegates business logic to SaleService.
"""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.schema_serializers import (
    CreateSaleRequestSchema,
    ErrorSchema,
    SaleResponseSchema,
    UpdateSaleRequestSchema,
)
from application.dtos.sale_dto import CreateSaleDTO, UpdateSaleDTO
from application.services.sale_service import SaleService
from infrastructure.repositories.sale_repository import SaleRepository


def _get_service():
    """Instantiate the service with the concrete sale repository."""
    return SaleService(SaleRepository())


class SaleComputeTotalsController(APIView):
    """
    POST /api/sales/compute-totals/

    Compute POS checkout totals without creating a sale record.
    Useful for live frontend updates before the customer confirms.

    Request body:
      items         – list of {quantity, unit_price, cost_price (opt.)}
      cash_tendered – float (optional, for change calculation)

    Formulas:
      Subtotal     = Σ (quantity × unit_price)
      Tax (12%VAT) = Subtotal × 0.12
      Total        = Subtotal + Tax
      Change       = CashTendered − Total
      COGS         = Σ (quantity × cost_price)
      GrossProfit  = Subtotal − COGS
    """

    @extend_schema(
        tags=["POS Sales"],
        request="api.schema_serializers.ComputeTotalsRequestSchema",
        responses={200: "api.schema_serializers.ComputeTotalsResponseSchema", 400: ErrorSchema},
    )
    def post(self, request):
        items = request.data.get("items", [])
        if not isinstance(items, list) or len(items) == 0:
            return Response(
                {"error": "'items' must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        discount_rate = request.data.get("discount_rate", 0.0)
        cash_tendered = request.data.get("cash_tendered", 0.0)
        service = _get_service()
        result = service.compute_totals(items, discount_rate, cash_tendered)
        return Response(result)


class SaleListCreateController(APIView):
    """
    GET  /api/sales/view/    → list all sales
    POST /api/sales/create/  → create a new sale (POS checkout)
    """

    @extend_schema(tags=["POS Sales"], responses=SaleResponseSchema(many=True))
    def get(self, request):
        service = _get_service()
        sales = service.get_all_sales()
        return Response([s.to_dict() for s in sales])

    @extend_schema(
        tags=["POS Sales"],
        request=CreateSaleRequestSchema,
        responses={201: SaleResponseSchema, 400: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        try:
            dto = CreateSaleDTO(
                sale_id=request.data.get("sale_id", ""),
                customer_name=request.data.get("customer_name", ""),
                table_number=request.data.get("table_number", ""),
                order_type=request.data.get("order_type", "Dine In"),
                cashier_name=request.data.get("cashier_name", ""),
                payment_method=request.data.get("payment_method", "Cash"),
                subtotal=request.data.get("subtotal", 0),
                discount=request.data.get("discount", 0),
                tax=request.data.get("tax", 0),
                total=request.data.get("total", 0),
                amount_tendered=request.data.get("amount_tendered", 0),
                change_amount=request.data.get("change_amount", 0),
                status=request.data.get("status", "Completed"),
                items=request.data.get("items", []),
            )
            sale = service.create_sale(dto)
            return Response(sale.to_dict(), status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {"errors": e.args[0]}, status=status.HTTP_400_BAD_REQUEST
            )


class SaleDetailController(APIView):
    """
    GET    /api/sales/view/<pk>/         → retrieve a sale
    PUT    /api/sales/edit/<pk>/         → full update
    PATCH  /api/sales/partialedit/<pk>/  → partial update
    DELETE /api/sales/delete/<pk>/       → delete
    """

    @extend_schema(
        tags=["POS Sales"],
        responses={200: SaleResponseSchema, 404: ErrorSchema},
    )
    def get(self, request, pk):
        service = _get_service()
        sale = service.get_sale(pk)
        if sale is None:
            return Response(
                {"error": "Sale not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(sale.to_dict())

    @extend_schema(
        tags=["POS Sales"],
        request=UpdateSaleRequestSchema,
        responses={200: SaleResponseSchema, 400: ErrorSchema, 404: ErrorSchema},
    )
    def put(self, request, pk):
        service = _get_service()
        try:
            dto = UpdateSaleDTO(**request.data)
            sale = service.update_sale(pk, dto)
            if sale is None:
                return Response(
                    {"error": "Sale not found."}, status=status.HTTP_404_NOT_FOUND
                )
            return Response(sale.to_dict())
        except ValueError as e:
            return Response(
                {"errors": e.args[0]}, status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        tags=["POS Sales"],
        request=UpdateSaleRequestSchema,
        responses={200: SaleResponseSchema, 400: ErrorSchema, 404: ErrorSchema},
    )
    def patch(self, request, pk):
        """Partial update — only provided fields are changed."""
        service = _get_service()
        try:
            dto = UpdateSaleDTO(**request.data)
            sale = service.update_sale(pk, dto)
            if sale is None:
                return Response(
                    {"error": "Sale not found."}, status=status.HTTP_404_NOT_FOUND
                )
            return Response(sale.to_dict())
        except ValueError as e:
            return Response(
                {"errors": e.args[0]}, status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        tags=["POS Sales"],
        responses={204: None, 404: ErrorSchema},
    )
    def delete(self, request, pk):
        service = _get_service()
        deleted = service.delete_sale(pk)
        if not deleted:
            return Response(
                {"error": "Sale not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
