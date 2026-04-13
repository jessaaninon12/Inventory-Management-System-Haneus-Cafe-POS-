"""
Django settings for Haneus Cafe POS — Clean Architecture.

Database: MySQL via XAMPP (default), MSSQL, or PostgreSQL via env.
Set DB_ENGINE=mysql or DB_ENGINE=mssql or DB_ENGINE=postgresql in your .env file.
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
    # Build OPTIONS — support Windows Authentication via DB_WINDOWS_AUTH=True
    _mssql_options = {
        "driver": os.environ.get("DB_MSSQL_DRIVER", "ODBC Driver 17 for SQL Server"),
        "extra_params": "TrustServerCertificate=yes",
    }
    if os.environ.get("DB_WINDOWS_AUTH", "False").lower() in ("true", "1", "yes"):
        _mssql_options["trusted_connection"] = "yes"

    DATABASES = {
        "default": {
            "ENGINE": "mssql",
            "NAME": os.environ.get("DB_NAME", "haneuscafedb"),
            "USER": os.environ.get("DB_USER", ""),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "1433"),
            "OPTIONS": _mssql_options,
            "CONN_MAX_AGE": int(os.environ.get("DB_CONN_MAX_AGE", "600")),
            "ATOMIC_REQUESTS": True,
        }
    }
elif DB_ENGINE == "postgresql":
    # PostgreSQL via psycopg2
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("DB_NAME", "haneuscafedb"),
            "USER": os.environ.get("DB_USER", "postgres"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "5432"),
            "CONN_MAX_AGE": int(os.environ.get("DB_CONN_MAX_AGE", "600")),
            "ATOMIC_REQUESTS": True,
        }
    }
else:
    # MySQL / MariaDB (XAMPP) — default
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.environ.get("DB_NAME", "haneuscafedb"),
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
            "CONN_MAX_AGE": int(os.environ.get("DB_CONN_MAX_AGE", "600")),
            "ATOMIC_REQUESTS": True,
        }
    }

# ------------------------------------------------------------------
# Cache configuration
# ------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": os.environ.get(
            "CACHE_BACKEND",
            "django.core.cache.backends.locmem.LocMemCache" if DEBUG else "django.core.cache.backends.db.DatabaseCache",
        ),
        "LOCATION": os.environ.get("CACHE_LOCATION", "haneus_cache_table"),
        "TIMEOUT": int(os.environ.get("CACHE_TIMEOUT", "300")),  # 5 minutes default
        "OPTIONS": {
            "MAX_ENTRIES": int(os.environ.get("CACHE_MAX_ENTRIES", "10000")),
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
        "rest_framework.permissions.IsAuthenticated" if os.environ.get("API_REQUIRE_AUTH", "False").lower() in ("true", "1", "yes") else "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 30,
    # ── Throttle config ──────────────────────────────────────────
    # NO global DEFAULT_THROTTLE_CLASSES — navigation endpoints must
    # NOT be throttled. Sensitive endpoints (login, password reset)
    # declare throttle_classes directly in their controllers.
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.environ.get("THROTTLE_ANON", "1000/hour"),
        "user": os.environ.get("THROTTLE_USER", "10000/hour"),
        # Sensitive endpoint scopes (used by api/throttles.py)
        "login": os.environ.get("THROTTLE_LOGIN", "20/minute"),
        "anon_login": os.environ.get("THROTTLE_ANON_LOGIN", "30/minute"),
        "password_reset": os.environ.get("THROTTLE_PW_RESET", "10/hour"),
        "anon_password_reset": os.environ.get("THROTTLE_ANON_PW_RESET", "10/hour"),
        "admin_approval": os.environ.get("THROTTLE_ADMIN_APPROVAL", "60/minute"),
    },
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
# CORS
# ------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = DEBUG or os.environ.get("CORS_ALLOW_ALL_ORIGINS", "False").lower() in ("true", "1", "yes")
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = []
if not CORS_ALLOW_ALL_ORIGINS:
    origins = os.environ.get("CORS_ALLOWED_ORIGINS", "")
    CORS_ALLOWED_ORIGINS = [o.strip() for o in origins.split(",") if o.strip()]

# ------------------------------------------------------------------
# Security headers
# ------------------------------------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "True").lower() in ("true","1","yes")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = "DENY"

# ------------------------------------------------------------------
# Email configuration
# ------------------------------------------------------------------
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend",
)

# SMTP settings — always loaded so .env controls everything
EMAIL_HOST          = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT          = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS       = os.environ.get("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
EMAIL_HOST_USER     = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "") or EMAIL_HOST_USER

