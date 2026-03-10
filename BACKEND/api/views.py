import os
import uuid

from django.conf import settings
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Sale, User
from .schema_serializers import (
    AuthSuccessSchema,
    ErrorSchema,
    LoginRequestSchema as LoginRequestDoc,
    RegisterRequestSchema as RegisterRequestDoc,
)
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    ProductSerializer,
    ProfileSerializer,
    RegisterSerializer,
    SaleSerializer,
    UserSerializer,
)


# ---------------------------------------------------------------------------
# Auth Views
# ---------------------------------------------------------------------------
class RegisterView(APIView):
    """POST /api/auth/register/ — create a new user account."""

    @extend_schema(
        tags=["Auth"],
        request=RegisterRequestDoc,
        responses={201: AuthSuccessSchema, 400: ErrorSchema},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "success": True,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ — authenticate and return user data."""

    @extend_schema(
        tags=["Auth"],
        request=LoginRequestDoc,
        responses={200: AuthSuccessSchema, 401: ErrorSchema},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                "success": True,
                "user": UserSerializer(user).data,
            }
        )


# ---------------------------------------------------------------------------
# Product CRUD Views
# ---------------------------------------------------------------------------
class ProductListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/products/      — list all products
    POST /api/products/      — create a new product
    """

    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/products/<id>/  — retrieve a single product
    PUT    /api/products/<id>/  — update a product
    DELETE /api/products/<id>/  — delete a product
    """

    queryset = Product.objects.all()
    serializer_class = ProductSerializer


# ---------------------------------------------------------------------------
# Sale CRUD Views
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Image Upload
# ---------------------------------------------------------------------------
class ImageUploadView(APIView):
    """POST /api/upload/ — upload an image file, returns its served URL."""
    parser_classes = [MultiPartParser]

    @extend_schema(tags=["Uploads"], request=None, responses={201: None, 400: ErrorSchema})
    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate image type
        allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in allowed:
            return Response(
                {"error": f"Invalid file type. Allowed: {', '.join(allowed)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save with unique name
        upload_dir = os.path.join(settings.MEDIA_ROOT, "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(upload_dir, filename)

        with open(filepath, "wb+") as dest:
            for chunk in file.chunks():
                dest.write(chunk)

        url = f"{settings.MEDIA_URL}uploads/{filename}"
        return Response({"url": url}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Profile Views
# ---------------------------------------------------------------------------
class ProfileDetailView(APIView):
    """GET / PUT /api/profile/<pk>/ — read or update a user profile."""

    @extend_schema(tags=["Profile"], responses={200: ProfileSerializer, 404: ErrorSchema})
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProfileSerializer(user).data)

    @extend_schema(tags=["Profile"], request=ProfileSerializer, responses={200: ProfileSerializer, 404: ErrorSchema})
    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """PUT /api/profile/<pk>/password/ — change user password."""

    @extend_schema(tags=["Profile"], request=ChangePasswordSerializer, responses={200: None, 400: ErrorSchema, 404: ErrorSchema})
    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not user.check_password(serializer.validated_data["current_password"]):
            return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"success": True, "message": "Password updated successfully."})


class SaleListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/sales/      — list all sales (newest first)
    POST /api/sales/      — create a new sale
    """

    queryset = Sale.objects.all()
    serializer_class = SaleSerializer


class SaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/sales/<id>/  — retrieve a single sale
    PUT    /api/sales/<id>/  — update a sale
    DELETE /api/sales/<id>/  — delete a sale
    """

    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
