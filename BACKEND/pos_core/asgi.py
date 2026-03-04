"""ASGI config for Haneus Cafe POS."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pos_core.settings")

application = get_asgi_application()
