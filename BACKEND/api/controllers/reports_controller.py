"""
Reports API controller — provides aggregated data for Stock, Sales, and Supplier reports.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, F, Q, Avg
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from datetime import timedelta
import csv, io

from infrastructure.data.models import (
    ProductModel,
    SaleModel,
    SaleItemModel,
    InventoryTransactionModel,
)


class StockReportController(APIView):
    """GET /api/reports/stock/
    Returns stock overview: all products with stock levels, values, and movement."""

    def get(self, request):
        try:
            products = ProductModel.objects.all().order_by('name')
            data = []
            for p in products:
                cost_value = float(p.cost or 0) * float(p.stock or 0)
                sell_value = float(p.price or 0) * float(p.stock or 0)
                stock_status = "Out of Stock" if p.stock <= 0 else (
                    "Low Stock" if p.stock <= p.low_stock_threshold else "In Stock"
                )
                data.append({
                    "id": p.id,
                    "name": p.name,
                    "category": p.category or "",
                    "stock": p.stock,
                    "unit": p.unit or "Piece/Item",
                    "cost": float(p.cost or 0),
                    "price": float(p.price or 0),
                    "cost_value": round(cost_value, 2),
                    "sell_value": round(sell_value, 2),
                    "low_stock_threshold": p.low_stock_threshold,
                    "stock_status": stock_status,
                    "supplier_name": p.supplier_name or "",
                })

            total_products = len(data)
            total_stock_value = sum(d["cost_value"] for d in data)
            low_stock_count = sum(1 for d in data if d["stock_status"] == "Low Stock")
            out_of_stock_count = sum(1 for d in data if d["stock_status"] == "Out of Stock")

            return Response({
                "products": data,
                "summary": {
                    "total_products": total_products,
                    "total_stock_value": round(total_stock_value, 2),
                    "low_stock_count": low_stock_count,
                    "out_of_stock_count": out_of_stock_count,
                },
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SalesReportController(APIView):
    """GET /api/reports/sales/?period=30
    Returns sales summary for the given period (days)."""

    def get(self, request):
        try:
            days = int(request.query_params.get("period", 30))
            cutoff = timezone.now() - timedelta(days=days)

            sales = SaleModel.objects.filter(
                created_at__gte=cutoff, status="Completed"
            )

            total_sales = sales.count()
            total_revenue = sales.aggregate(s=Sum("total"))["s"] or 0
            total_items = SaleItemModel.objects.filter(
                sale__in=sales
            ).aggregate(s=Sum("quantity"))["s"] or 0

            # Daily breakdown
            daily = (
                sales.annotate(day=TruncDate("created_at"))
                .values("day")
                .annotate(count=Count("id"), revenue=Sum("total"))
                .order_by("day")
            )
            daily_data = [
                {
                    "date": d["day"].isoformat() if d["day"] else "",
                    "count": d["count"],
                    "revenue": float(d["revenue"] or 0),
                }
                for d in daily
            ]

            # Top products by quantity
            top_products = (
                SaleItemModel.objects.filter(sale__in=sales)
                .values("product_name")
                .annotate(
                    qty=Sum("quantity"),
                    revenue=Sum("total"),
                )
                .order_by("-qty")[:10]
            )
            top_data = [
                {
                    "product_name": t["product_name"],
                    "quantity": t["qty"],
                    "revenue": float(t["revenue"] or 0),
                }
                for t in top_products
            ]

            # Payment method breakdown
            payment_methods = (
                sales.values("payment_method")
                .annotate(count=Count("id"), total=Sum("total"))
                .order_by("-count")
            )
            payment_data = [
                {
                    "method": pm["payment_method"],
                    "count": pm["count"],
                    "total": float(pm["total"] or 0),
                }
                for pm in payment_methods
            ]

            return Response({
                "summary": {
                    "total_sales": total_sales,
                    "total_revenue": round(float(total_revenue), 2),
                    "total_items_sold": total_items,
                    "period_days": days,
                },
                "daily": daily_data,
                "top_products": top_data,
                "payment_methods": payment_data,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SupplierReportController(APIView):
    """GET /api/reports/suppliers/
    Returns supplier performance analytics."""

    def get(self, request):
        try:
            # Get all products grouped by supplier
            suppliers = (
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

            data = []
            for s in suppliers:
                # Get total sold for this supplier's products
                supplier_products = ProductModel.objects.filter(supplier_name=s["supplier_name"])
                product_ids = list(supplier_products.values_list("id", flat=True))

                total_sold = SaleItemModel.objects.filter(
                    product_id__in=product_ids
                ).aggregate(s=Sum("quantity"))["s"] or 0

                total_revenue = SaleItemModel.objects.filter(
                    product_id__in=product_ids
                ).aggregate(s=Sum("total"))["s"] or 0

                stock_val = float(s["total_stock_value"] or 0)
                total_units = total_sold + (s["total_stock"] or 0)
                sell_through = round((total_sold / total_units * 100), 1) if total_units > 0 else 0

                # Status classification
                if s["product_count"] >= 3 and sell_through >= 50:
                    perf_status = "Strong"
                elif s["product_count"] >= 3 and sell_through < 30:
                    perf_status = "High Supply, Low Movement"
                elif sell_through >= 50:
                    perf_status = "Good"
                elif sell_through >= 30:
                    perf_status = "Average"
                else:
                    perf_status = "Underperforming"

                data.append({
                    "supplier_name": s["supplier_name"],
                    "supplier_contact": s["supplier_contact"] or "",
                    "product_count": s["product_count"],
                    "total_stock": s["total_stock"] or 0,
                    "avg_price": round(float(s["avg_price"] or 0), 2),
                    "total_stock_value": round(stock_val, 2),
                    "total_sold": total_sold,
                    "total_revenue": round(float(total_revenue or 0), 2),
                    "sell_through_rate": sell_through,
                    "performance_status": perf_status,
                })

            return Response({
                "suppliers": data,
                "summary": {
                    "total_suppliers": len(data),
                    "strong_count": sum(1 for d in data if d["performance_status"] == "Strong"),
                    "underperforming_count": sum(1 for d in data if d["performance_status"] in ("Underperforming", "High Supply, Low Movement")),
                },
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
