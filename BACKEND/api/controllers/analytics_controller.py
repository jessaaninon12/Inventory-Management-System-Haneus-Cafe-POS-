"""
Analytics controller — thin HTTP layer for analytics endpoints.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from application.services.analytics_service import AnalyticsService
from infrastructure.repositories.analytics_repository import AnalyticsRepository


def _get_service():
    return AnalyticsService(AnalyticsRepository())


class QuarterlyTopSellingController(APIView):
    """GET /api/analytics/top-selling/?quarter=2026-Q1&limit=10"""

    def get(self, request):
        try:
            service = _get_service()
            quarter = request.query_params.get("quarter", None)
            limit = int(request.query_params.get("limit", 10))
            data = service.get_quarterly_top_selling(quarter, limit)
            return Response(data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Failed to load top selling: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class QuarterlyBestSellingController(APIView):
    """GET /api/analytics/best-selling/?quarter=2026-Q1&limit=10"""

    def get(self, request):
        try:
            service = _get_service()
            quarter = request.query_params.get("quarter", None)
            limit = int(request.query_params.get("limit", 10))
            data = service.get_quarterly_best_selling(quarter, limit)
            return Response(data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Failed to load best selling: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PriceHistoryController(APIView):
    """GET /api/analytics/price-history/?product=Shawarma Master"""

    def get(self, request):
        product_name = request.query_params.get("product", "")
        if not product_name:
            return Response(
                {"error": "product query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            service = _get_service()
            data = service.get_price_history(product_name)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to load price history: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MonthlyPredictionsController(APIView):
    """GET /api/analytics/predictions/"""

    def get(self, request):
        try:
            service = _get_service()
            data = service.get_monthly_predictions()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to load predictions: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ToBeSoldController(APIView):
    """GET /api/analytics/to-be-sold/"""

    def get(self, request):
        try:
            service = _get_service()
            limit = int(request.query_params.get("limit", 10))
            data = service.get_to_be_sold(limit)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to load to-be-sold: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class NotToBeSoldController(APIView):
    """GET /api/analytics/not-to-be-sold/"""

    def get(self, request):
        try:
            service = _get_service()
            limit = int(request.query_params.get("limit", 10))
            data = service.get_not_to_be_sold(limit)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to load not-to-be-sold: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SupplierAnalyticsController(APIView):
    """GET /api/analytics/supplier-analytics/
    Returns supplier classifications: top, low-performing, high-production, low-production."""

    def get(self, request):
        try:
            from django.db.models import Sum, Count, F, Avg
            from infrastructure.data.models import ProductModel, SaleItemModel

            suppliers_qs = (
                ProductModel.objects.exclude(supplier_name__isnull=True)
                .exclude(supplier_name="")
                .values("supplier_name", "supplier_contact")
                .annotate(
                    product_count=Count("id"),
                    total_stock=Sum("stock"),
                    avg_price=Avg("price"),
                    total_stock_value=Sum(F("cost") * F("stock")),
                )
                .order_by("-product_count")
            )

            suppliers = []
            for s in suppliers_qs:
                product_ids = list(
                    ProductModel.objects.filter(supplier_name=s["supplier_name"])
                    .values_list("id", flat=True)
                )
                total_sold = SaleItemModel.objects.filter(
                    product_id__in=product_ids
                ).aggregate(s=Sum("quantity"))["s"] or 0

                total_revenue = SaleItemModel.objects.filter(
                    product_id__in=product_ids
                ).aggregate(s=Sum("total"))["s"] or 0

                total_units = total_sold + (s["total_stock"] or 0)
                sell_through = round(
                    (total_sold / total_units * 100), 1
                ) if total_units > 0 else 0

                suppliers.append({
                    "supplier_name": s["supplier_name"],
                    "supplier_contact": s["supplier_contact"] or "",
                    "product_count": s["product_count"],
                    "total_stock": s["total_stock"] or 0,
                    "total_sold": total_sold,
                    "total_revenue": round(float(total_revenue or 0), 2),
                    "sell_through_rate": sell_through,
                    "stock_value": round(float(s["total_stock_value"] or 0), 2),
                })

            # Classify suppliers into 4 categories
            top_suppliers = sorted(
                [s for s in suppliers if s["sell_through_rate"] >= 50],
                key=lambda x: (-x["total_revenue"], -x["sell_through_rate"])
            )
            low_performing = sorted(
                [s for s in suppliers if s["sell_through_rate"] < 30],
                key=lambda x: x["sell_through_rate"]
            )
            high_production = sorted(
                suppliers,
                key=lambda x: -x["total_stock"]
            )[:10]
            low_production = sorted(
                suppliers,
                key=lambda x: x["product_count"]
            )[:10]

            return Response({
                "top_suppliers": top_suppliers,
                "low_performing": low_performing,
                "high_production": high_production,
                "low_production": low_production,
                "total_suppliers": len(suppliers),
            })
        except Exception as e:
            return Response(
                {"error": f"Failed to load supplier analytics: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
