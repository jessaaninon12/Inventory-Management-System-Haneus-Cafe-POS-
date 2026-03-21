# Manually created migration — changes image_url from URLField to TextField
# so it can store base64 data URIs (which exceed URLField's max_length).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("infrastructure", "0005_alter_saleitemmodel_cost_price"),
    ]

    operations = [
        migrations.AlterField(
            model_name="productmodel",
            name="image_url",
            field=models.TextField(blank=True, null=True),
        ),
    ]
