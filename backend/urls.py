"""
Root URL configuration for the backend project.

This file defines the URL routes for the Django application, 
including admin, authentication, users, and accounts.
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView, TemplateView
from django.conf import settings
from django.conf.urls.static import static
import os
from pathlib import Path
from django.views.static import serve as static_serve

# import the new view
from accounts.views import google_auth

FRONTEND_URL = os.getenv("FRONTEND_URL") or getattr(settings, "FRONTEND_URL", None)
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_BUILD_DIR = os.path.join(BASE_DIR, 'optimabank-loyalty', 'build')
SERVE_SPA_FROM_BUILD = os.path.isdir(FRONTEND_BUILD_DIR)

urlpatterns = [
    path("admin/", admin.site.urls),

    # new google auth endpoint (SPA -> POST id_token here)
    path("api/auth/google/", google_auth, name="google-auth"),

    path("auth/", include("rest_framework_social_oauth2.urls")),
    path("users/", include("users.urls")),
    path("accounts/", include("accounts.urls")),
    path("chatbot/", include("chatbot.urls")),
]

if SERVE_SPA_FROM_BUILD:
    urlpatterns += [
        # Serve PWA/manifest and icon assets from the React build root
        path("manifest.json", static_serve, {"path": "manifest.json", "document_root": FRONTEND_BUILD_DIR}),
        path("favicon.ico", static_serve, {"path": "favicon.ico", "document_root": FRONTEND_BUILD_DIR}),
        path("logo192.png", static_serve, {"path": "logo192.png", "document_root": FRONTEND_BUILD_DIR}),
        path("logo512.png", static_serve, {"path": "logo512.png", "document_root": FRONTEND_BUILD_DIR}),
        path("", TemplateView.as_view(template_name="index.html")),
        re_path(r"^(?!admin/|api/|auth/|users/|accounts/|chatbot/).*$", TemplateView.as_view(template_name="index.html")),
    ]
else:
    urlpatterns += [
        path("", RedirectView.as_view(url=FRONTEND_URL or "/accounts/")),
    ]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
