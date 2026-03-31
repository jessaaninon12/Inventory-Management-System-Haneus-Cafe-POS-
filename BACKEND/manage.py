#!/usr/bin/env python
"""
Django management script for Haneus Cafe POS — Clean Architecture.

Usage:
    python manage.py runserver
    python manage.py makemigrations
    python manage.py migrate
    python manage.py createsuperuser
    python manage.py shell
"""

import os
import sys


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure it's installed and available "
            "on your PYTHONPATH environment variable. Did you forget to "
            "activate a virtual environment?\n"
            "Run: pip install -r requirements.txt"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
