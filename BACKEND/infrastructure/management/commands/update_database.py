"""
infrastructure/management/commands/update_database.py

EF-style alias for the custom ``migrate`` command (which auto-creates
the database before applying migrations).

Entity Framework equivalent:
    Update-Database

Django equivalent:
    python manage.py migrate

Behavior
--------
1. Connects to the database SERVER (not the target DB).
2. Creates the target database if it does not exist
   (MySQL: CREATE DATABASE IF NOT EXISTS; SQL Server: IF NOT EXISTS CREATE DATABASE).
3. Applies all pending Django migration files — tables, columns, constraints.

This command supports:
    - MySQL / MariaDB (XAMPP)  — default instance + fallback hosts
    - SQL Server (SSMS 19)     — default instance, SQLEXPRESS, LocalDB
      Auth: SQL Server Authentication → Windows Authentication (fallback)

Usage examples
--------------
    # Apply all pending migrations (auto-creates DB if missing):
    python manage.py update_database

    # Apply only a specific app's migrations:
    python manage.py update_database api
    python manage.py update_database infrastructure

    # Fake-apply the initial migration (when tables already exist):
    python manage.py update_database --fake-initial

This command behaves identically to ``migrate``; the name is provided
as a familiar entry point for developers coming from .NET / EF.
"""

from infrastructure.management.commands.migrate import Command as MigrateCommand


class Command(MigrateCommand):
    help = (
        "EF-style alias for 'migrate'.  "
        "Auto-creates the database if missing, then applies all pending migrations.  "
        "Equivalent to Update-Database in Entity Framework."
    )
