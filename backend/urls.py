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

# import the new view
from accounts.views import google_auth

FRONTEND_URL = os.getenv("FRONTEND_URL") or getattr(settings, "FRONTEND_URL", None)

urlpatterns = [
    path("admin/", admin.site.urls),

    # new google auth endpoint (SPA -> POST id_token here)
    path("api/auth/google/", google_auth, name="google-auth"),

    path("auth/", include("rest_framework_social_oauth2.urls")),
    path("users/", include("users.urls")),
    path("accounts/", include("accounts.urls")),
    path("chatbot/", include("chatbot.urls")),
    # Serve the SPA's index.html at root
    path("", TemplateView.as_view(template_name="index.html")),
    # Catch-all for client-side routes (exclude admin and API prefixes)
    re_path(r"^(?!admin/|api/|auth/|users/|accounts/|chatbot/).*$", TemplateView.as_view(template_name="index.html")),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
