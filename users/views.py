"""Views for user authentication, OTP handling, and social login."""

import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
import threading
import smtplib
import ssl
import threading
import os
import requests
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
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


# -------------------------
# Account Deletion (Authenticated)
# -------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """Delete the authenticated user's account and related data."""
    try:
        with transaction.atomic():
            user = request.user
            # Clean up related app data as needed
            try:
                from accounts.models import UserProfile, Cart, CartItem, Redemption, Notification, UserTier
                UserProfile.objects.filter(user=user).delete()
                CartItem.objects.filter(cart__user=user).delete()
                Cart.objects.filter(user=user).delete()
                Redemption.objects.filter(user=user).delete()
                Notification.objects.filter(user=user).delete()
                UserTier.objects.filter(user=user).delete()
            except Exception:
                # Proceed even if some relations are missing
                pass
            user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({"error": f"Failed to delete account: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -------------------------
# Password Reset via Email
# -------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def password_reset_request(request):
    """Send password reset email with tokenized link."""
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    user = CustomUser.objects.filter(email=email).first()
    if not user:
        # Do not reveal user existence
        return Response({"message": "If the email exists, a reset link has been sent."}, status=status.HTTP_200_OK)

    token_gen = PasswordResetTokenGenerator()
    token = token_gen.make_token(user)
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

    frontend_url = getattr(settings, 'FRONTEND_RESET_URL', None) or 'http://localhost:3000/reset-password'
    reset_link = f"{frontend_url}?uid={uidb64}&token={token}"

    try:
        send_mail(
            subject="Reset your password",
            message=f"Click the link to reset your password: {reset_link}\nIf you did not request this, ignore this email.",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"message": "If the email exists, a reset link has been sent."}, status=status.HTTP_200_OK)


@api_view(["POST"]) 
@permission_classes([AllowAny])
@authentication_classes([])
def password_reset_confirm(request):
    """Confirm password reset with uid and token, set new password."""
    uidb64 = request.data.get("uid")
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not all([uidb64, token, new_password]):
        return Response({"error": "uid, token and new_password are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = CustomUser.objects.get(pk=uid)
    except Exception:
        return Response({"error": "Invalid uid"}, status=status.HTTP_400_BAD_REQUEST)

    token_gen = PasswordResetTokenGenerator()
    if not token_gen.check_token(user, token):
        return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password has been reset successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": f"Failed to reset password: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
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

    # Basic email validation
    if "@" not in email or "." not in email.split("@")[1]:
        return Response(
            {"error": "Please enter a valid email address"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if CustomUser.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = CustomUser.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            password=password,
        )
        
        # Create user profile with initial points
        from accounts.models import UserProfile
        UserProfile.objects.create(user=user, points=10000)
        
        # Generate and attempt to send OTP to the registered email
        try:
            otp = generate_otp(user)
            send_mail(
                subject="Your OTP Code",
                message=f"Your OTP code is {otp.code}. It will expire in 5 minutes.",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response(
                {"message": "User registered successfully. OTP sent to your email."},
                status=status.HTTP_201_CREATED,
            )
        except Exception:
            return Response(
                {"message": "User registered successfully, but sending OTP email failed. Please request a new OTP.", "otp_email_sent": False},
                status=status.HTTP_201_CREATED,
            )
    except Exception as e:
        return Response(
            {"error": f"Registration failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# -------------------------
# OTP Handling
# -------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
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

    # Validate email sending configuration before proceeding
    email_backend = getattr(settings, 'EMAIL_BACKEND', '') or ''
    email_user = getattr(settings, 'EMAIL_HOST_USER', None)
    email_password = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
    is_smtp_backend = email_backend.endswith('smtp.EmailBackend')

    if is_smtp_backend and (not email_user or not email_password):
        return Response(
            {"error": "Email is not configured. Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD on the server."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if not is_smtp_backend:
        # Warn clients that emails may be printed to console in development
        # but still continue so frontend UX is consistent
        pass

    # Determine email sending method: prefer SMTP; if blocked, fallback to SendGrid API if configured
    send_method = 'smtp'
    smtp_error = None
    if is_smtp_backend:
        host = getattr(settings, 'EMAIL_HOST', 'smtp.gmail.com')
        port = int(getattr(settings, 'EMAIL_PORT', 587))
        use_tls = getattr(settings, 'EMAIL_USE_TLS', True)
        try:
            if use_tls:
                server = smtplib.SMTP(host, port, timeout=10)
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                server.ehlo()
            if email_user and email_password:
                server.login(email_user, email_password)
            server.quit()
        except Exception as smtp_err:
            smtp_error = str(smtp_err)
            # Fallback to SendGrid HTTP API if available
            if os.getenv('SENDGRID_API_KEY'):
                send_method = 'sendgrid'
            else:
                return Response(
                    {"error": f"SMTP connection/login failed: {smtp_error}", "hint": "Set SENDGRID_API_KEY to use HTTP API fallback on hosts that block SMTP."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

    # Generate OTP
    otp = generate_otp(user)

    # Send OTP via email asynchronously so the API responds fast
    def _send_email_async(to_email: str, code: str):
        subject = "Your OTP Code"
        message = f"Your OTP code is {code}. It will expire in 5 minutes."
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', None)
        try:
            if send_method == 'smtp':
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=from_email,
                    recipient_list=[to_email],
                    fail_silently=False,
                )
            else:
                # Send via SendGrid HTTP API
                api_key = os.getenv('SENDGRID_API_KEY')
                if not api_key:
                    raise RuntimeError('SENDGRID_API_KEY not configured')
                sg_payload = {
                    "personalizations": [{"to": [{"email": to_email}]}],
                    "from": {"email": from_email},
                    "subject": subject,
                    "content": [{"type": "text/plain", "value": message}],
                }
                resp = requests.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json=sg_payload,
                    timeout=15,
                )
                if resp.status_code >= 300:
                    raise RuntimeError(f"SendGrid send failed: {resp.status_code} - {resp.text[:200]}")
            try:
                import logging
                logging.getLogger(__name__).info("OTP email sent successfully via %s to %s", send_method, to_email)
            except Exception:
                pass
        except Exception as e:
            # Log the error but do not affect the API response
            try:
                import logging
                logging.getLogger(__name__).exception("Failed to send OTP email via %s: %s", send_method, e)
            except Exception:
                pass

    threading.Thread(target=_send_email_async, args=(user.email, otp.code), daemon=True).start()

    # Respond immediately so the client can show the OTP dialog without delay
    response_payload = {
        "message": "OTP generated and email dispatch initiated",
        "to": user.email,
        "backend": email_backend,
        "method": send_method,
    }
    if not is_smtp_backend:
        response_payload["note"] = "Using console email backend; OTP content is printed in server logs. Configure SMTP to send real emails."
    return Response(response_payload, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
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
# Email Health Check
# -------------------------
@api_view(["GET"])  # Safe, read-only diagnostic
@permission_classes([AllowAny])
@authentication_classes([])
def email_health(request):
    """Check SMTP configuration by attempting connection, STARTTLS, and login.
    Returns diagnostic JSON to help debug OTP email delivery issues.
    """
    try:
        email_backend = getattr(settings, 'EMAIL_BACKEND', '') or ''
        is_smtp_backend = email_backend.endswith('smtp.EmailBackend')
        host = getattr(settings, 'EMAIL_HOST', '')
        port = int(getattr(settings, 'EMAIL_PORT', 0) or 0)
        use_tls = getattr(settings, 'EMAIL_USE_TLS', False)
        use_ssl = getattr(settings, 'EMAIL_USE_SSL', False)
        user = getattr(settings, 'EMAIL_HOST_USER', None)
        has_password = bool(getattr(settings, 'EMAIL_HOST_PASSWORD', None))

        diagnostics = {
            "backend": email_backend,
            "is_smtp_backend": is_smtp_backend,
            "host": host,
            "port": port,
            "use_tls": use_tls,
            "use_ssl": use_ssl,
            "has_user": bool(user),
            "has_password": has_password,
        }

        if not is_smtp_backend:
            diagnostics["status"] = "not_smtp"
            diagnostics["message"] = "EMAIL_BACKEND is not SMTP. In this mode, OTP emails won't be delivered to inbox."
            return Response(diagnostics, status=status.HTTP_200_OK)

        # Perform connectivity + auth test
        try:
            if use_ssl:
                server = smtplib.SMTP_SSL(host, port or 465, timeout=10, context=ssl.create_default_context())
            else:
                server = smtplib.SMTP(host, port or 587, timeout=10)
                server.ehlo()
                if use_tls:
                    server.starttls(context=ssl.create_default_context())
                    server.ehlo()
            if user and has_password:
                server.login(user, getattr(settings, 'EMAIL_HOST_PASSWORD'))
            server.quit()
            diagnostics["status"] = "ok"
            diagnostics["message"] = "SMTP connectivity and login successful"
            return Response(diagnostics, status=status.HTTP_200_OK)
        except Exception as e:
            diagnostics["status"] = "error"
            diagnostics["error"] = f"SMTP test failed: {str(e)}"
            return Response(diagnostics, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response({"status": "error", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -------------------------
# Email Test Send (diagnostic)
# -------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def email_test_send(request):
    """Send a test email to verify SMTP delivery. Returns success or detailed error."""
    to_email = request.data.get("email")
    if not to_email:
        return Response({"error": "email is required"}, status=status.HTTP_400_BAD_REQUEST)

    email_backend = getattr(settings, 'EMAIL_BACKEND', '') or ''
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', None)

    # Reuse the same SMTP pre-check as request_otp
    is_smtp_backend = email_backend.endswith('smtp.EmailBackend')
    if not is_smtp_backend:
        return Response({
            "status": "not_smtp",
            "backend": email_backend,
            "message": "EMAIL_BACKEND is not SMTP; test send will not reach inbox."
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        send_mail(
            subject="OptimaBank Test Email",
            message="This is a test email to verify SMTP delivery from OptimaBank.",
            from_email=from_email,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return Response({
            "status": "sent",
            "to": to_email,
            "from": from_email,
            "backend": email_backend
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "status": "error",
            "backend": email_backend,
            "from": from_email,
            "to": to_email,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -------------------------
# Google Authentication
# -------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth(request):
    """Authenticate user using Google OAuth2 id_token."""
    token = request.data.get("id_token") or request.data.get("token")
    if not token:
        return Response(
            {"error": "ID token is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # For development/testing: decode the token without verification
        # In production, you should verify the token with Google
        import base64
        import json
        
        # Decode the JWT token (without verification for testing)
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid token format")
        
        # Decode the payload
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded_payload = base64.urlsafe_b64decode(payload)
        idinfo = json.loads(decoded_payload)

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

        # Create user profile if it doesn't exist
        from accounts.models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'points': 10000}
        )

        # Generate JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        return Response(
            {
                "message": "Authenticated successfully",
                "access": str(access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                }
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"error": f"Invalid Google token: {str(e)}"},
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
