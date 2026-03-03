from django.urls import path

from . import views

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    # Products CRUD
    path("products/", views.ProductListCreateView.as_view(), name="product-list"),
    path("products/<int:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    # Sales CRUD
    path("sales/", views.SaleListCreateView.as_view(), name="sale-list"),
    path("sales/<int:pk>/", views.SaleDetailView.as_view(), name="sale-detail"),
]
