"""
WSGI config for the OptimaBank project.

This file exposes the WSGI callable as a module-level variable named ``application``.
It is used by Django’s runserver and any WSGI deployments.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

application = get_wsgi_application()
