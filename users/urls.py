"""
URL configuration for users app.

Defines authentication endpoints including Google OAuth, 
JWT tokens, OTP verification, and user profile management.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # Google OAuth
    path("auth/google/", views.google_auth, name="google_login"),

    # User signup
    path("signup/", views.register_user, name="signup"),

    # Request OTP for login
    path("request-otp/", views.request_otp, name="request_otp"),

    # Verify OTP
    path('verify-otp/', views.verify_otp, name='verify_otp'),

    # Account management
    path('delete-account/', views.delete_account, name='delete_account'),
    path('password-reset/request/', views.password_reset_request, name='password_reset_request'),
    path('password-reset/confirm/', views.password_reset_confirm, name='password_reset_confirm'),

    # JWT login & refresh
    path("login/", TokenObtainPairView.as_view(), name="jwt_login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Profile
    path("profile/", views.profile, name="profile"),
]
