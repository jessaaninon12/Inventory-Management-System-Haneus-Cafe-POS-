"""
Migration: add cost_price column to sale_items table.
Used for COGS (Cost of Goods Sold) calculation.

  COGS = Σ (quantity_sold × cost_price)
  GrossProfit = TotalSales − COGS
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("infrastructure", "0003_salemodel_saleitemmodel"),
    ]

    operations = [
        migrations.AddField(
            model_name="saleitemmodel",
            name="cost_price",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=10,
                help_text="Unit cost price at time of sale — used for COGS calculation.",
            ),
        ),
    ]
