# Generated migration for User model enhancements

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_user_user_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='require_password_change',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='temporary_password_hash',
            field=models.CharField(blank=True, default='', max_length=128),
        ),
        migrations.AddField(
            model_name='user',
            name='profile_picture_url',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
