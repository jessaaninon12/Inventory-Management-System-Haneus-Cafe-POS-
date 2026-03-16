"""
User serializers — DRF serializers for the user API boundary.

Covers:
  - Registration  (RegisterSerializer)
  - Login         (LoginSerializer)
  - Profile       (UserSerializer, ProfileSerializer, ChangePasswordSerializer)
"""

from rest_framework import serializers

from .models import User


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.Serializer):
    """Validate and create a new user account."""

    first_name = serializers.CharField(max_length=150)
    last_name  = serializers.CharField(max_length=150)
    username   = serializers.CharField(max_length=150)
    email      = serializers.EmailField()
    password   = serializers.CharField(write_only=True, min_length=6)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class LoginSerializer(serializers.Serializer):
    """Validate login credentials (username + password)."""

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


# ---------------------------------------------------------------------------
# Profile display / update
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """Minimal user representation — used in auth responses."""

    class Meta:
        model  = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id"]


class ProfileSerializer(serializers.ModelSerializer):
    """
    Full user profile — used by GET /api/profile/<pk>/ and
    PUT /api/profile/<pk>/ to display and update profile fields.
    username and date_joined are read-only.
    """

    class Meta:
        model  = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "bio",
            "avatar_url",
            "date_joined",
        ]
        read_only_fields = ["id", "username", "date_joined"]


class ChangePasswordSerializer(serializers.Serializer):
    """Validate a password-change request."""

    current_password = serializers.CharField(write_only=True)
    new_password     = serializers.CharField(write_only=True, min_length=6)
