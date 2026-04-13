"""
Sale repository — concrete implementation using Django ORM.
"""

import re

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from application.interfaces.sale_repository_interface import SaleRepositoryInterface
from domain.entities.sale import Sale, SaleItem
from infrastructure.data.models import ProductModel, SaleModel, SaleItemModel


class SaleRepository(SaleRepositoryInterface):

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_all(self):
        qs = SaleModel.objects.prefetch_related("items").all()
        return [self._to_entity(m) for m in qs]

    def get_by_id(self, pk):
        try:
            m = SaleModel.objects.prefetch_related("items").get(pk=pk)
            return self._to_entity(m)
        except SaleModel.DoesNotExist:
            return None

    def get_today_count(self):
        """Return the highest sequence number used in sale_id for today.

        Scans sale_id values matching today's date prefix
        (e.g. ``SALE-20260413-XXXX``) and returns the MAX numeric suffix.
        Falls back to counting rows if no matching sale_ids are found.

        This is critical for the retry logic in SaleService.create_sale():
        using ``count()`` fails when rows are deleted or gaps exist,
        because the same sequence number would be regenerated forever.
        """
        from datetime import date as _date
        date_prefix = f"SALE-{_date.today().strftime('%Y%m%d')}-"

        # Find all sale_ids for today and extract the max suffix
        todays_ids = list(
            SaleModel.objects.filter(sale_id__startswith=date_prefix)
            .values_list("sale_id", flat=True)
        )
        max_seq = 0
        for sid in todays_ids:
            match = re.search(r"(\d+)$", sid)
            if match:
                max_seq = max(max_seq, int(match.group(1)))
        return max_seq

    def get_latest_customer_number(self):
        """Return the numeric part of the latest customer number, or 0 if none exist."""
        latest = SaleModel.objects.order_by("-created_at").values_list("customer_number", flat=True).first()
        if latest is None or not latest:
            return 0
        # Extract numeric part from "CUST-000001" format
        try:
            numeric_part = int(latest.split("-")[1])
            return numeric_part
        except (IndexError, ValueError):
            return 0

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create(self, sale: Sale):
        with transaction.atomic():
            m = SaleModel.objects.create(
                sale_id=sale.sale_id,
                receipt_number=sale.receipt_number,
                customer_number=sale.customer_number,
                cashier_name=sale.cashier_name,
                order_type=sale.order_type,
                customer_name=sale.customer_name,
                table_number=sale.table_number,
                payment_method=sale.payment_method,
                subtotal=sale.subtotal,
                discount=sale.discount,
                tax=sale.tax,
                total=sale.total,
                amount_tendered=sale.amount_tendered,
                change_amount=sale.change_amount,
                status=sale.status,
            )
            for item in sale.items:
                SaleItemModel.objects.create(
                    sale=m,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    cost_price=item.cost_price,
                    total=item.total,
                )
                # Atomically deduct stock and sync is_orderable flag
                if item.product_id:
                    updated = ProductModel.objects.filter(
                        pk=item.product_id, stock__gte=item.quantity
                    ).update(stock=F("stock") - item.quantity)
                    # If stock was deducted, check if it reached zero
                    if updated:
                        ProductModel.objects.filter(
                            pk=item.product_id, stock__lte=0
                        ).update(is_orderable=False)
        # Invalidate product cache so POS grid shows new stock immediately
        try:
            from django.core.cache import cache
            if hasattr(cache, 'delete_pattern'):
                cache.delete_pattern("products:*")
            else:
                for page in range(1, 20):
                    for limit in [12, 15, 30, 50, 100, 200]:
                        cache.delete(f"products:list:v1:{page}:{limit}")
                        cache.delete(f"products:list:v2:{page}:{limit}")
                cache.delete("products:low_stock")
        except Exception:
            pass
        return self.get_by_id(m.pk)

    def update(self, sale: Sale):
        SaleModel.objects.filter(pk=sale.id).update(
            customer_name=sale.customer_name,
            table_number=sale.table_number,
            payment_method=sale.payment_method,
            status=sale.status,
        )
        return self.get_by_id(sale.id)

    def delete(self, pk):
        deleted, _ = SaleModel.objects.filter(pk=pk).delete()
        return deleted > 0

    # ------------------------------------------------------------------
    # Mapping
    # ------------------------------------------------------------------

    @staticmethod
    def _to_entity(m: SaleModel) -> Sale:
        items = [
            SaleItem(
                id=i.pk,
                sale_id=m.pk,
                product_id=i.product_id,
                product_name=i.product_name,
                quantity=i.quantity,
                unit_price=float(i.unit_price),
                cost_price=float(i.cost_price),
            )
            for i in m.items.all()
        ]
        return Sale(
            id=m.pk,
            sale_id=m.sale_id,
            receipt_number=m.receipt_number,
            customer_number=m.customer_number,
            cashier_name=m.cashier_name,
            order_type=m.order_type,
            customer_name=m.customer_name,
            table_number=m.table_number,
            payment_method=m.payment_method,
            subtotal=float(m.subtotal),
            discount=float(m.discount),
            tax=float(m.tax),
            total=float(m.total),
            amount_tendered=float(m.amount_tendered),
            change_amount=float(m.change_amount),
            status=m.status,
            items=items,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )
