from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_user_avatar_url_user_bio_user_phone"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="user_type",
            field=models.CharField(
                choices=[("Admin", "Admin"), ("Staff", "Staff")],
                default="Staff",
                max_length=10,
            ),
        ),
    ]
