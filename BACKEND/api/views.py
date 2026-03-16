import os
import uuid

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Sale
from .schema_serializers import ErrorSchema
from .product_serializers import ProductSerializer, SaleSerializer


# ---------------------------------------------------------------------------
# Product CRUD Views (legacy — api.models.Product / api_product table)
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
