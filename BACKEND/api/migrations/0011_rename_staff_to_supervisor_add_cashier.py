"""
Migration: Rename Staff → Supervisor, add Cashier role, increase max_length
"""
from django.db import migrations, models


def rename_staff_to_supervisor(apps, schema_editor):
    """Data migration: rename all Staff users to Supervisor."""
    User = apps.get_model("api", "User")
    User.objects.filter(user_type="Staff").update(user_type="Supervisor")


def reverse_rename(apps, schema_editor):
    """Reverse: rename Supervisor back to Staff."""
    User = apps.get_model("api", "User")
    User.objects.filter(user_type="Supervisor").update(user_type="Staff")


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0010_add_reset_attempt_model"),
    ]

    operations = [
        # 1. First increase max_length so "Supervisor" fits
        migrations.AlterField(
            model_name="user",
            name="user_type",
            field=models.CharField(
                choices=[
                    ("Admin", "Admin"),
                    ("Supervisor", "Supervisor"),
                    ("Cashier", "Cashier"),
                ],
                default="Supervisor",
                max_length=15,
            ),
        ),
        # 2. Data migration: rename existing Staff → Supervisor
        migrations.RunPython(rename_staff_to_supervisor, reverse_rename),
    ]
