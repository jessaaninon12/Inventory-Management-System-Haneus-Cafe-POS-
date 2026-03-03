from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Sale
from .serializers import (
    LoginSerializer,
    ProductSerializer,
    RegisterSerializer,
    SaleSerializer,
    UserSerializer,
)


# ---------------------------------------------------------------------------
# Auth Views
# ---------------------------------------------------------------------------
class RegisterView(APIView):
    """POST /api/auth/register/ — create a new user account."""

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

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = authenticate(username=user_obj.username, password=password)
        if user is None:
            return Response(
                {"error": "Invalid credentials."},
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
