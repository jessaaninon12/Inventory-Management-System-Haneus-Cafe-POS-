"""
infrastructure/management/commands/migrate.py

Extends Django's built-in ``migrate`` command with automatic database
creation (Code-First behavior).

When ``python manage.py migrate`` is executed:

1. ``ensure_database_exists()`` connects to the database SERVER (not the
   target database) and creates the target database if it is missing.
   This fixes the "Cannot open database" error when running against a
   freshly installed SQL Server or MySQL/MariaDB instance.

2. Django's standard migration logic runs normally — all pending
   migration files are applied to the now-existing database.

Both MySQL/XAMPP and SQL Server/SSMS 19 are supported.
The ``makemigrations`` command is unaffected (it never needs a DB).
"""

from django.core.management.commands.migrate import Command as BaseCommand

from infrastructure.data.db_init import ensure_database_exists


class Command(BaseCommand):
    help = (
        "Creates the database if it does not exist, then applies all "
        "pending Django migrations.  Supports MySQL (XAMPP) and "
        "SQL Server (SSMS 19)."
    )

    def handle(self, *app_labels, **options):
        # ── Step 1: auto-create the database if it is missing ────────
        ensure_database_exists()

        # ── Step 2: run Django's standard migration logic ────────────
        super().handle(*app_labels, **options)
