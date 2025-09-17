"""
Database models for the users app, including custom user and OTP models.
"""

import uuid
import random
from typing import Optional

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


# -------------------------
# Custom User Manager
# -------------------------
class CustomUserManager(BaseUserManager):
    """Manager for custom user model."""

    def create_user(
        self, email, first_name, last_name, phone_number, password=None, **extra_fields
    ):
        """Create and save a regular user with email, name, phone, and password."""
        if not email:
            raise ValueError("Email must be set")
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self, email, first_name, last_name, phone_number, password=None, **extra_fields
    ):
        """Create and save a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(
            email, first_name, last_name, phone_number, password, **extra_fields
        )


# -------------------------
# Custom User
# -------------------------
class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as username."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "phone_number"]

    def __str__(self) -> str:
        return str(self.email)


# -------------------------
# OTP Manager
# -------------------------
class OTPManager(models.Manager):
    """Custom manager for OTP model."""

    def create_otp(self, user: CustomUser) -> "OTP":
        """Create a new OTP for a given user."""
        code = f"{random.randint(100000, 999999)}"
        otp = self.create(user=user, code=code)
        return otp

    def verify_otp(self, user: CustomUser, code: str) -> Optional["OTP"]:
        """Check if an OTP is valid (not expired & not used)."""
        return self.filter(user=user, code=code, is_used=False).first()


# -------------------------
# OTP Model
# -------------------------
class OTP(models.Model):
    """OTP model to store OTP codes for users."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="otps")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    objects = OTPManager()

    def save(self, *args, **kwargs):
        """Auto-generate OTP code if not set."""
        if not self.code:
            self.code = f"{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        user_email = getattr(self.user, "email", "")
        return f"{user_email} - {self.code}"
