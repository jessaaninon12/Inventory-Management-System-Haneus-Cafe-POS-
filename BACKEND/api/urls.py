from django.urls import path

from . import views

urlpatterns = [
    # Upload
    path("upload/", views.ImageUploadView.as_view(), name="image-upload"),
    # Products CRUD (legacy)
    path("products/", views.ProductListCreateView.as_view(), name="product-list"),
    path("products/<int:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    # Sales CRUD (legacy)
    path("sales/", views.SaleListCreateView.as_view(), name="sale-list"),
    path("sales/<int:pk>/", views.SaleDetailView.as_view(), name="sale-detail"),
]
