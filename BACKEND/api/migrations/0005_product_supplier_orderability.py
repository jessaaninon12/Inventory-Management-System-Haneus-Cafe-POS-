# Generated migration for Product model enhancements

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_user_password_reset_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='supplier_name',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='product',
            name='supplier_contact',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='product',
            name='is_orderable',
            field=models.BooleanField(default=True),
        ),
    ]
