"""Serializers for the CustomUser and OTP models."""

from rest_framework import serializers
from users.models import CustomUser, OTP


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the CustomUser model to handle user data."""

    class Meta:
        """Meta class for UserSerializer."""
        model = CustomUser
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "is_active", "date_joined"]


class OTPSerializer(serializers.ModelSerializer):
    """Serializer for the OTP model to handle OTP generation and verification."""

    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        """Meta class for OTPSerializer."""
        model = OTP
        fields = [
            "id",
            "user",
            "user_email",
            "code",
            "created_at",
            "is_verified",
        ]
        read_only_fields = ["id", "created_at", "is_verified", "user_email"]
                       