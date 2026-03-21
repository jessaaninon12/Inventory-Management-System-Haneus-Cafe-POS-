"""
Migration 0007: add POS receipt fields to SaleModel and line-item total to SaleItemModel.

New SaleModel columns:
  receipt_number  – unique receipt ID (REC-YYYYMMDD-XXXX), nullable for existing rows
  customer_number – auto-generated CUST-XXXXXX identifier
  cashier_name    – name of the logged-in cashier at time of sale
  order_type      – "Dine In" or "Take Out"
  discount        – discount amount deducted from subtotal before VAT
  amount_tendered – cash/digital amount given by customer
  change_amount   – change returned to customer

New SaleItemModel column:
  total           – pre-computed line-item total (quantity × unit_price)
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("infrastructure", "0006_alter_productmodel_image_url"),
    ]

    operations = [
        # ── SaleModel new fields ───────────────────────────────────────
        migrations.AddField(
            model_name="salemodel",
            name="receipt_number",
            field=models.CharField(max_length=30, unique=True, null=True, blank=True),
        ),
        migrations.AddField(
            model_name="salemodel",
            name="customer_number",
            field=models.CharField(max_length=20, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="salemodel",
            name="cashier_name",
            field=models.CharField(max_length=200, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="salemodel",
            name="order_type",
            field=models.CharField(max_length=20, blank=True, default="Dine In"),
        ),
        migrations.AddField(
            model_name="salemodel",
            name="discount",
            field=models.DecimalField(max_digits=12, decimal_places=2, default=0),
        ),
        migrations.AddField(
            model_name="salemodel",
            name="amount_tendered",
            field=models.DecimalField(max_digits=12, decimal_places=2, default=0),
        ),
        migrations.AddField(
            model_name="salemodel",
            name="change_amount",
            field=models.DecimalField(max_digits=12, decimal_places=2, default=0),
        ),
        # ── SaleItemModel new field ────────────────────────────────────
        migrations.AddField(
            model_name="saleitemmodel",
            name="total",
            field=models.DecimalField(max_digits=12, decimal_places=2, default=0),
        ),
    ]
