"""
infrastructure/management/commands/add_migration.py

EF-style alias for Django's ``makemigrations`` command.

Entity Framework equivalent:
    Add-Migration InitialCreate
    Add-Migration <MigrationName>

Django equivalent:
    python manage.py makemigrations
    python manage.py makemigrations <app_label>

Usage examples
--------------
    # Detect changes in ALL installed apps and generate migration files:
    python manage.py add_migration

    # Detect changes in a specific app only:
    python manage.py add_migration api
    python manage.py add_migration infrastructure

    # Use a custom migration name:
    python manage.py add_migration --name InitialCreate
    python manage.py add_migration infrastructure --name AddUserTypeField

This command behaves identically to ``makemigrations``; the name is
provided as a familiar entry point for developers coming from .NET / EF.
"""

from django.core.management.commands.makemigrations import Command as BaseCommand


class Command(BaseCommand):
    help = (
        "EF-style alias for 'makemigrations'.  "
        "Detects model changes and generates Django migration files.  "
        "Equivalent to Add-Migration in Entity Framework."
    )
