"""
ASGI config for the backend project.

This file exposes the ASGI callable as a module-level variable named ``application``.
It is used for serving Django with ASGI servers (e.g., Daphne, Uvicorn, Hypercorn).
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

application = get_asgi_application()
