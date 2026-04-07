# Haneus Cafe POS — Inventory Management System

> Point of Sale + Inventory Management System for Haneus Cafe.
> Supports **Admin** and **Staff** roles with a Clean Architecture Django backend and a Vanilla JS multi-page frontend.

---

## A. Architecture Type

**System Architecture:** Multi-tier Clean Architecture

- **Frontend:** Multi-page static frontend (HTML/CSS/Vanilla JS) — no framework, no SPA router.
- **Backend:** Django REST Framework API with Clean Architecture (4 layers: Domain, Application, Infrastructure, API/Controller).
- **Database:** Relational database — MySQL via XAMPP (default), SQL Server via SSMS, or PostgreSQL via pgAdmin (configurable).
- **Communication:** Frontend calls backend via `fetch()` REST API over HTTP/JSON.
- **Auth:** Token-based session stored in browser `localStorage`.

**Clean Architecture Layers:**

```text
┌─────────────────────────────────────────────────────┐
│  API LAYER         BACKEND/api/controllers/         │  HTTP only — parses request, calls service
├─────────────────────────────────────────────────────┤
│  APPLICATION       BACKEND/application/services/    │  Business logic, use-cases, DTOs
├─────────────────────────────────────────────────────┤
│  INFRASTRUCTURE    BACKEND/infrastructure/          │  ORM models, concrete repositories
├─────────────────────────────────────────────────────┤
│  DOMAIN            BACKEND/domain/entities/         │  Pure Python entities, zero framework deps
└─────────────────────────────────────────────────────┘
```
**Dependency Rule:** API → Application → Infrastructure ↔ Domain. Upper layers never depend on lower layers.

---

## B. Full Project Structure

```text
Inventory-Management-System-Haneus-Cafe-POS-/
├── .env.example                        # Root-level environment template
├── .gitignore                          # Git ignore rules
├── index.html                          # Root redirect page
├── README.md                           # Public project documentation
├── metadata.json                       # Project metadata
│
├── .github/
│   └── workflows/
│       └── django.yml                  # CI/CD workflow for Django
│
├── FRONTEND/                           # Static multi-page frontend
│   ├── login.html                      # Login page
│   ├── register.html                   # Registration page
│   ├── dashboard.html                  # Admin dashboard
│   ├── staffdashboard.html             # Staff dashboard
│   ├── products.html                   # Products listing page
│   ├── createproduct.html              # Create/Edit product page
│   ├── sales.html                      # Sales records page
│   ├── managestock.html                # Stock management page
│   ├── lowstock.html                   # Low-stock alerts page
│   ├── profile.html                    # User profile page
│   ├── usermanagement.html             # User management page (Admin only)
│   ├── user.html                       # User detail page
│   ├── supplier.html                   # Supplier references page
│   ├── reset-password.html             # Password reset via token link
│   ├── css/
│   │   ├── sidebar.css                 # Shared sidebar styles (all pages)
│   │   ├── dashboard.css               # Admin dashboard styles
│   │   └── ...                         # (Other CSS files)
│   ├── js/
│   │   ├── pos.js                      # POS terminal — cart, VAT 12%, receipt PNG
│   │   ├── dashboard.js                # Admin dashboard data + charts + View All modals
│   │   ├── staffdashboard.js           # Staff dashboard — greetings, weekly analytics
│   │   └── ...                         # (Other JS files)
│   └── images/
│       └── coffee.png
│
└── BACKEND/                            # Django REST API — Clean Architecture
    ├── manage.py                       # Django management entry point
    ├── requirements.txt                # Python dependencies
    ├── setup_db.py                     # Database initialization helper
    ├── .env                            # Active environment config (git-ignored)
    ├── .env.example                    # Environment template
    │
    ├── config/                         # Django project settings
    │   ├── settings.py                 # All Django settings (DB, DRF, CORS, email, cache)
    │   ├── urls.py                     # Root URL config + FRONTEND static serving (dev)
    │   ├── wsgi.py                     # WSGI entry point (production)
    │   └── asgi.py                     # ASGI entry point
    │
    ├── api/                            # Django app: Auth + API Controllers
    │   ├── models.py                   # Custom auth, product, order models
    │   ├── controllers/                # Clean Architecture URL patterns & controllers
    │   ├── migrations/                 # Django ORM migrations for api app
    │   └── ...                         
    │
    ├── application/                    # Application layer — pure business logic
    │   ├── dtos/                       # Data Transfer Objects
    │   ├── interfaces/                 # Abstract Repository Interfaces
    │   └── services/                   # Business rules (User, Product, Order, Email, etc.)
    │
    ├── domain/                         # Domain layer — purest layer
    │   └── entities/                   # Python entities (User, Product, Order)
    │
    └── infrastructure/                 # Infrastructure layer — Data access
        ├── data/                       # Django ORM underlying Models
        ├── repositories/               # Concrete repository implementations
        ├── migrations/                 # Migrations for infrastructure models
        └── management/commands/        # Custom manage.py utilities
```

---

## C. Tech Stack

**Backend**
- Python 3.9+
- Django 4.2
- Django REST Framework 3.14+
- drf-spectacular 0.27+ (OpenAPI 3.0 schema)
- django-cors-headers 4.3+
- python-dotenv 1.0+
- Pillow 10.0+ (image processing)
- Async Email Service (SMTP via Background Threads)

**Frontend**
- HTML5 & CSS3
- Vanilla JavaScript (ES6+, no framework)
- Lucide Icons (CDN)
- Google Fonts — Inter
- html2canvas (PNG Receipts)

**Database**
- MySQL 8.0 via XAMPP (default)
- SQL Server 19 via MSSQL + ODBC Driver 17 (optional)
- PostgreSQL 14+ via psycopg2 (optional)

---

## D. Backend Setup

### 1. Prerequisites
- Python 3.9+
- One of: MySQL via XAMPP **|** SQL Server via SSMS 19 **|** PostgreSQL
- `pip`

### 2. Environment & Dependencies
```bash
cd BACKEND
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

pip install -r requirements.txt

# Then install the driver for your chosen database:
pip install mysqlclient          # MySQL (XAMPP)
pip install mssql-django pyodbc  # SQL Server (SSMS)
pip install psycopg2-binary      # PostgreSQL
```

### 3. Configure Database
Run the interactive setup wizard — choose **[A] MySQL**, **[B] SQL Server**, or **[C] PostgreSQL**:
```bash
python setup_db.py
```
*(If manual: set `DB_ENGINE=mysql`, `DB_ENGINE=mssql`, or `DB_ENGINE=postgresql` and fill in DB_NAME, DB_USER, etc. in BACKEND/.env)*

---

## E. Database Migration Setup

Initialize your database schema and apply models:

```bash
python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate
```

### Custom Superuser Creation
To initialize the system with an admin user, we utilize a custom management command tailored for our architectural user model:
```bash
python manage.py createsuperuser_custom
```
*This robustly sets up the initial Administrator bypassing the standard Django createsuperuser constraints, allowing you to establish the primary account safely.*

---

## F. Ports and Access Links

Start the backend:
```bash
python manage.py runserver 8000
```

| Service | Protocol | Access URL |
|---|---|---|
| Django Dev Server | HTTP | `http://localhost:8000` |
| **Frontend Platform** | HTTP | **`http://localhost:8000/login.html`** |
| Scalar API Docs | HTTP | `http://localhost:8000/api/scaler/v1` |
| OpenAPI 3.0 Schema | YAML | `http://localhost:8000/api/schema/` |
| Django Admin Panel | HTTP | `http://localhost:8000/admin/` |

> **Frontend Serving:** In `DEBUG=True` mode, Django hosts the vanilla frontend inherently. No live-server needed!

---

## G. Backup Process

**Soft Deletion & Snapshots**
All administrative deletions (Users, Products, Sales records) are non-destructive in operation:
- Records are intercepted prior to deletion.
- A full JSON snapshot is preserved in `api_deletedrecordsbackup` prior to commit.
- **Access:** Terminal only. No UI prevents tampering.

To review backed up records:
```bash
python manage.py show_deleted_records
python manage.py show_deleted_records --type=user
python manage.py show_deleted_records --type=product
python manage.py show_deleted_records --type=sale
```

---

## H. System Overview

**Haneus Cafe POS** serves as an intelligent Point of Sale and robust tracking nexus designed exclusively for cafe environments. 
- **Role-Based Access Control:** Secure boundaries between Owners (Admin) and Employees (Staff).
- **Dynamic Dashboards:** In-depth metrics, interactive charts, payroll calculations, and low-stock alarms.
- **Embedded POS Element:** Streamlined checkout interface supporting VAT exclusions, multiple payment methods, and automated receipt image generation.
- **Inventory Subsystem:** Stock lifecycle tracking, supplier registry, and automated visual flags when supplies reach critically low levels or zero.
- **Security Protocols:** Two-phase Reset via Code processes, forced temporary password resets, and asynchronous logging.

---

## I. Recent Enhancements - Feature Highlights

- **Resilient Asynchronous Email Service:** Overhauled email dispatch utilizing exponential backoff retry logic. Solved persistent 535 SMTP Authentication errors for stable Gmail notifications (Admin approvals, rejections, reset codes, and timestamped password change alerts).
- **Mobile Scrolling Stability:** Resolved critical mobile viewport clipping. The Profile card dynamically calculates flex dimensions to spawn native iOS/Android scroll constraints internally protecting all action buttons globally.
- **Robust Staff Dashboards:** Shift to a purely analytic staff module detailing weekly payroll projections, rolling profit margins, and 75 rotating personalized greetings.
- **Backend High-Performance Hardening:** Transition from global throttles leading to 429 errors into specific endpoint bounds. Adopted 30/page offset pagination universally enforcing `to_dict_compact()` (reduced 3.4MB visual payloads to ~817 byte responses).
- **Seamless 6-Digit Password Reset Workflow:** Integrated an HTML sliding unified wizard (`#resetTrack`) directly into login bounds, managing both CODE verifications and direct Email recoveries smoothly.
- **Visual POS Constraints:** Automated sold-out visual queues locking out the "Add to Cart" button instantly upon `stock === 0`.

---

## J. Development Status

**Overall Status**: Functional and Finalized.

The ecosystem completed its stabilization phases in April 2026. The shift into the final 33% of system work concluded with mobile accessibility improvements and backend email thread resilience.

### J.1 Frontend Status
**Status: COMPLETED**

- **Mobile Viewports**: Completed nested Flexbox scroll control safely insulated inside `main` wrappers, enforcing content accessibility.
- **Unified Password Changing**: Multi-step wizard layout constraints fully finalized.
- **Pagination & Modals**: Implemented responsive View All panels matching dashboard analytics arrays.
- **Sales Data Integration**: Clean alignment of Supplier metadata on stock interfaces and order modals. Checkouts function logically with the backend models.