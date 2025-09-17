"""
Root URL configuration for the backend project.

This file defines the URL routes for the Django application, 
including admin, authentication, users, and accounts.
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

# import the new view
from accounts.views import google_auth

urlpatterns = [
    path("admin/", admin.site.urls),

    # new google auth endpoint (SPA -> POST id_token here)
    path("api/auth/google/", google_auth, name="google-auth"),

    path("auth/", include("rest_framework_social_oauth2.urls")),
    path("users/", include("users.urls")),
    path("accounts/", include("accounts.urls")),
    path("", RedirectView.as_view(url="/accounts/")),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
