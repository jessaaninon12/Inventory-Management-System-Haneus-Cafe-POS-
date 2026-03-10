"""
Django settings for Haneus Cafe POS — Clean Architecture.

Database: MySQL via XAMPP (default) or MSSQL via env.
Set DB_ENGINE=mysql or DB_ENGINE=mssql in your .env file.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# ------------------------------------------------------------------
# Paths & env
# ------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-change-this-in-production",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = os.environ.get(
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1"
).split(",")

# ------------------------------------------------------------------
# Installed apps
# ------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    # Local apps
    "api",              # Auth models (User), legacy CRUD views
    "infrastructure",   # Clean Architecture ORM models
]

# Custom user model (defined in api.models.User)
AUTH_USER_MODEL = "api.User"

# ------------------------------------------------------------------
# Middleware
# ------------------------------------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ------------------------------------------------------------------
# Database — flexible via DB_ENGINE env var
# ------------------------------------------------------------------
DB_ENGINE = os.environ.get("DB_ENGINE", "mysql").lower()

if DB_ENGINE == "mssql":
    DATABASES = {
        "default": {
            "ENGINE": "mssql",
            "NAME": os.environ.get("DB_NAME", "HaneusCafeDB"),
            "USER": os.environ.get("DB_USER", "sa"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "1433"),
            "OPTIONS": {
                "driver": os.environ.get(
                    "DB_MSSQL_DRIVER", "ODBC Driver 17 for SQL Server"
                ),
            },
        }
    }
else:
    # MySQL / MariaDB (XAMPP) — default
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.environ.get("DB_NAME", "Haneus-Inventory"),
            "USER": os.environ.get("DB_USER", "root"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
            "PORT": os.environ.get("DB_PORT", "3306"),
            "OPTIONS": {
                "init_command": (
                    "SET sql_mode='STRICT_TRANS_TABLES', "
                    "default_storage_engine='INNODB'"
                ),
                "charset": "utf8mb4",
            },
        }
    }

# ------------------------------------------------------------------
# Password validation
# ------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ------------------------------------------------------------------
# Internationalization
# ------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Manila"
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------
# Static files
# ------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ------------------------------------------------------------------
# Media files (uploaded images)
# ------------------------------------------------------------------
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ------------------------------------------------------------------
# Default PK type
# ------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------
# Django REST Framework
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# ------------------------------------------------------------------
# drf-spectacular — OpenAPI 3.0 schema + Scalar docs
# ------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "Haneus Cafe POS API",
    "DESCRIPTION": (
        "REST API for the Haneus Cafe POS & Inventory Management System.\n\n"
        "Includes authentication, product CRUD, order management, "
        "and inventory tracking endpoints."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "TAGS": [
        {"name": "Auth", "description": "User registration and login"},
        {"name": "Dashboard", "description": "Aggregated dashboard statistics"},
        {"name": "Profile", "description": "User profile management"},
        {"name": "Products", "description": "Product catalog CRUD"},
        {"name": "Orders", "description": "Order lifecycle management"},
        {"name": "Inventory", "description": "Stock tracking and adjustments"},
        {"name": "Uploads", "description": "File/image uploads"},
        {"name": "Sales", "description": "Legacy sales records"},
    ],
}

# ------------------------------------------------------------------
# CORS — allow frontend during development
# ------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
