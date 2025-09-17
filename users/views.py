"""Views for user authentication, OTP handling, and social login."""

import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from users.models import CustomUser, OTP


# -------------------------
# Helper: Generate OTP
# -------------------------
def generate_otp(user: CustomUser) -> OTP:
    """Generate and save a new OTP for a user."""
    otp_code = f"{random.randint(100000, 999999)}"

    otp = OTP.objects.create(
        user=user,
        code=otp_code,
        created_at=timezone.now(),
        is_used=False,
    )
    return otp


def is_otp_valid(otp: OTP, code: str) -> bool:
    """Check if an OTP is valid (not expired, not used, and matches)."""
    expiry_time = otp.created_at + timedelta(minutes=5)  # 5 min validity
    return (otp.code == code) and (not otp.is_used) and (timezone.now() <= expiry_time)


# -------------------------
# User Registration
# -------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user."""
    email = request.data.get("email")
    first_name = request.data.get("first_name")
    last_name = request.data.get("last_name")
    phone_number = request.data.get("phone_number")
    password = request.data.get("password")

    if not all([email, first_name, last_name, phone_number, password]):
        return Response(
            {"error": "All fields are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if CustomUser.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    CustomUser.objects.create_user(
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        password=password,
    )

    return Response(
        {"message": "User registered successfully"},
        status=status.HTTP_201_CREATED,
    )


# -------------------------
# OTP Handling
# -------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def request_otp(request):
    """Request an OTP for login or verification."""
    email = request.data.get("email")

    if not email:
        return Response(
            {"error": "Email is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = CustomUser.objects.filter(email=email).first()
    if not user:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Generate OTP
    otp = generate_otp(user)

    # Send OTP via email
    send_mail(
        subject="Your OTP Code",
        message=f"Your OTP code is {otp.code}. It will expire in 5 minutes.",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify the OTP for a given email."""
    email = request.data.get("email")
    code = request.data.get("otp")

    if not email or not code:
        return Response(
            {"error": "Email and OTP are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = CustomUser.objects.filter(email=email).first()
    if not user:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Get latest OTP for this user
    otp = OTP.objects.filter(user=user).order_by("-created_at").first()
    if not otp or not is_otp_valid(otp, code):
        return Response(
            {"error": "Invalid or expired OTP"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Mark OTP as used
    otp.is_used = True
    otp.save()

    return Response({"message": "OTP verified successfully"}, status=status.HTTP_200_OK)


# -------------------------
# Google Authentication
# -------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth(request):
    """Authenticate user using Google OAuth2 id_token."""
    token = request.data.get("id_token")
    if not token:
        return Response(
            {"error": "ID token is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Verify the token against Google's public keys
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,  # Must match your OAuth Client ID
        )

        email = idinfo.get("email")
        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")

        if not email:
            return Response(
                {"error": "Google token did not return email"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create or get user (ignore unused variable 'created')
        user, _ = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "phone_number": "",
            },
        )

        return Response(
            {
                "message": "Authenticated successfully",
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError:
        return Response(
            {"error": "Invalid Google token"},
            status=status.HTTP_400_BAD_REQUEST,
        )


# -------------------------
# Profile (Authenticated Test)
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    """Return the profile of the logged-in user."""
    user = request.user
    return Response(
        {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
        },
        status=status.HTTP_200_OK,
    )
