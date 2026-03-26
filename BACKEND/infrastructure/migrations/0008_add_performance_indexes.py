# Generated: 2026-03-26 — Performance indexes for infrastructure app models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("infrastructure", "0007_salemodel_receipt_fields"),
    ]

    operations = [
        # ── OrderModel indexes ─────────────────────────────────────────
        migrations.AddIndex(
            model_name="ordermodel",
            index=models.Index(
                fields=["status", "date"],
                name="idx_order_status_date",
            ),
        ),
        # ── SaleModel indexes ──────────────────────────────────────────
        migrations.AddIndex(
            model_name="salemodel",
            index=models.Index(
                fields=["status", "created_at"],
                name="idx_sale_status_created",
            ),
        ),
        # ── InventoryTransactionModel indexes ──────────────────────────
        migrations.AddIndex(
            model_name="inventorytransactionmodel",
            index=models.Index(
                fields=["product", "-timestamp"],
                name="idx_invtxn_product_time",
            ),
        ),
    ]
