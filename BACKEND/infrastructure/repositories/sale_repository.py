"""
Sale repository — concrete implementation using Django ORM.
"""

from django.utils import timezone

from application.interfaces.sale_repository_interface import SaleRepositoryInterface
from domain.entities.sale import Sale, SaleItem
from infrastructure.data.models import SaleModel, SaleItemModel


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
        """Return how many sales have been created today (for receipt sequencing)."""
        today = timezone.now().date()
        return SaleModel.objects.filter(created_at__date=today).count()

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create(self, sale: Sale):
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
