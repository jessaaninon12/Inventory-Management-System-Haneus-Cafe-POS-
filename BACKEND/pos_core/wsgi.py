"""WSGI config for Haneus Cafe POS."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pos_core.settings")

application = get_wsgi_application()
