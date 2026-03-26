# Generated: 2026-03-26 — Performance indexes for api app models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_passwordresettoken_deletedrecordsbackup_and_more"),
    ]

    operations = [
        # ── PasswordResetToken indexes ────────────────────────────────
        migrations.AddIndex(
            model_name="passwordresettoken",
            index=models.Index(
                fields=["token", "is_used"],
                name="idx_pw_reset_token_used",
            ),
        ),
        migrations.AddIndex(
            model_name="passwordresettoken",
            index=models.Index(
                fields=["expires_at"],
                name="idx_pw_reset_expires_at",
            ),
        ),
        # ── AdminApprovalRequest indexes ──────────────────────────────
        migrations.AddIndex(
            model_name="adminapprovalrequest",
            index=models.Index(
                fields=["status"],
                name="idx_approval_status",
            ),
        ),
        migrations.AddIndex(
            model_name="adminapprovalrequest",
            index=models.Index(
                fields=["status", "-created_at"],
                name="idx_approval_status_created",
            ),
        ),
        # ── DeletedRecordsBackup indexes ──────────────────────────────
        migrations.AddIndex(
            model_name="deletedrecordsbackup",
            index=models.Index(
                fields=["record_type"],
                name="idx_deleted_record_type",
            ),
        ),
        migrations.AddIndex(
            model_name="deletedrecordsbackup",
            index=models.Index(
                fields=["record_type", "-deleted_at"],
                name="idx_deleted_type_time",
            ),
        ),
    ]
