"""
Migration: add sales and sale_items tables for POS functionality.
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("infrastructure", "0002_useradminmodel_userstaffmodel"),
    ]

    operations = [
        migrations.CreateModel(
            name="SaleModel",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("sale_id", models.CharField(max_length=50, unique=True)),
                ("customer_name", models.CharField(max_length=200)),
                ("table_number", models.CharField(blank=True, default="", max_length=50)),
                (
                    "payment_method",
                    models.CharField(
                        choices=[
                            ("Cash", "Cash"),
                            ("Card", "Card"),
                            ("GCash", "GCash"),
                            ("Maya", "Maya"),
                        ],
                        default="Cash",
                        max_length=20,
                    ),
                ),
                (
                    "subtotal",
                    models.DecimalField(decimal_places=2, default=0, max_digits=12),
                ),
                (
                    "tax",
                    models.DecimalField(decimal_places=2, default=0, max_digits=12),
                ),
                (
                    "total",
                    models.DecimalField(decimal_places=2, default=0, max_digits=12),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("Completed", "Completed"),
                            ("Pending", "Pending"),
                            ("Cancelled", "Cancelled"),
                        ],
                        default="Pending",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "sales",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="SaleItemModel",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("product_name", models.CharField(max_length=200)),
                ("quantity", models.IntegerField(default=1)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)),
                (
                    "sale",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="infrastructure.salemodel",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="infrastructure.productmodel",
                    ),
                ),
            ],
            options={
                "db_table": "sale_items",
            },
        ),
    ]
