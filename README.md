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
├── AGENTS.md                           # Deep system intelligence (git-ignored)
├── RULES.MD                            # Development rules & standards
├── README.md                           # This file
├── metadata.json                       # Project metadata
├── responsive.md                       # 2026 Responsive UI/UX specification
├── readysecurityanddeploymentready.md  # Security & deployment readiness audit
├── IMP AND ERROR.md                    # Implementation log & error resolutions
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
│   ├── pos.html                        # POS terminal page
│   ├── sales.html                      # Sales records page
│   ├── managestock.html                # Stock management page
│   ├── lowstock.html                   # Low-stock alerts page
│   ├── profile.html                    # User profile page
│   ├── usermanagement.html             # User management page (Admin only)
│   ├── user.html                       # User detail page
│   ├── supplier.html                   # Supplier references page
│   ├── reset-password.html             # Password reset via token link
│   ├── css/
│   │   ├── sidebar.css                 # Shared sidebar styles (all pages, 354 lines)
│   │   ├── responsive.css              # Full responsive system (734 lines, 7 breakpoints)
│   │   ├── responsive-cards.css        # Shared table-to-card layout (239 lines)
│   │   ├── pos.css                     # POS terminal styles (1575 lines)
│   │   ├── dashboard.css               # Admin dashboard styles
│   │   ├── staffdashboard.css          # Staff dashboard styles
│   │   ├── managestock.css             # Manage stock styles (774 lines)
│   │   ├── usermanagement.css          # User management styles (704 lines)
│   │   ├── payment-modals.css          # POS payment modal styles
│   │   └── ...                         # (Other page-specific CSS files)
│   ├── js/
│   │   ├── sidebar-toggle.js           # Unified sidebar toggle (all pages)
│   │   ├── header-common.js            # Shared header: profile flyout, notifications, search (460 lines)
│   │   ├── auto-refresh.js             # Lightweight AJAX auto-refresh module (60 lines)
│   │   ├── pos.js                      # POS terminal — cart, VAT 12%, receipt PNG, AbortController
│   │   ├── dashboard.js                # Admin dashboard data + bar chart + View All modals
│   │   ├── staffdashboard.js           # Staff dashboard — greetings, weekly analytics, payroll
│   │   ├── products.js                 # Products CRUD + pagination + AbortController + debounce
│   │   ├── managestock.js              # Stock adjustment + server-side pagination (30/page)
│   │   ├── sales.js                    # Sales records + pagination + client-side filtering
│   │   ├── usermanagement.js           # User management + pagination + AbortController
│   │   ├── role-control.js             # Role-based page access guard
│   │   ├── alert-modal.js              # Custom alert modal utility
│   │   ├── logout-modal.js             # Logout confirmation modal
│   │   └── ...                         # (Other page-specific JS files)
│   └── images/
│       ├── coffee.png
│       └── coffee1.png
│
└── BACKEND/                            # Django REST API — Clean Architecture
    ├── manage.py                       # Django management entry point
    ├── requirements.txt                # Python dependencies
    ├── setup_db.py                     # Database initialization helper
    ├── .env                            # Active environment config (git-ignored)
    ├── .env.example                    # Environment template
    │
    ├── config/                         # Django project settings
    │   ├── settings.py                 # All Django settings (DB, DRF, CORS, email, cache, throttle)
    │   ├── urls.py                     # Root URL config + FRONTEND static serving (dev)
    │   ├── wsgi.py                     # WSGI entry point (production)
    │   └── asgi.py                     # ASGI entry point
    │
    ├── api/                            # Django app: Auth + API Controllers
    │   ├── models.py                   # Custom User, Product, PasswordResetToken, AdminApprovalRequest
    │   ├── throttles.py                # Rate throttle classes (5 classes)
    │   ├── controllers/                # Clean Architecture controllers (10 files)
    │   │   ├── urls.py                 # All /api/ route definitions
    │   │   ├── user_controller.py      # Auth + profile + user management + risk (667 lines)
    │   │   ├── product_controller.py   # Product CRUD controllers
    │   │   ├── order_controller.py     # Order lifecycle (create/cancel/complete)
    │   │   ├── inventory_controller.py # Inventory summary + stock adjust
    │   │   ├── sale_controller.py      # POS sale create/view/compute-totals
    │   │   ├── dashboard_controller.py # Dashboard stats + chart data
    │   │   ├── staff_dashboard_controller.py  # Staff dashboard + payroll
    │   │   ├── password_reset_controller.py   # Forgot/reset password (5 endpoints)
    │   │   └── admin_approval_controller.py   # Admin registration approval
    │   └── migrations/                 # Django ORM migrations (0001–0009)
    │
    ├── application/                    # Application layer — pure business logic
    │   ├── dtos/                       # Data Transfer Objects (8 DTOs)
    │   ├── interfaces/                 # Abstract Repository Interfaces (8 interfaces)
    │   └── services/                   # Business rules (10 services)
    │       ├── user_service.py         # Register, login, profile, password
    │       ├── product_service.py      # Product CRUD + pagination
    │       ├── sale_service.py         # POS sale creation + totals computation
    │       ├── inventory_service.py    # Stock adjust + history
    │       ├── dashboard_service.py    # Aggregated KPIs + chart data
    │       ├── password_reset_service.py  # Token/code generation, verification
    │       ├── email_service.py        # Async email dispatch (background threads)
    │       ├── reset_risk_service.py   # Risk assessment for password reset
    │       └── admin_approval_service.py  # Approval lifecycle
    │
    ├── domain/                         # Domain layer — pure Python, zero framework deps
    │   └── entities/                   # Business entities (7 entities)
    │       ├── sale.py                 # Sale + SaleItem + compute_totals() — TAX_RATE = 0.12
    │       ├── product.py              # Product + adjust_stock() + stock_status
    │       ├── user.py                 # User entity + validation
    │       ├── order.py                # Order entity
    │       ├── inventory.py            # InventoryTransaction entity
    │       ├── admin_approval.py       # AdminApproval entity
    │       └── reset_attempt.py        # ResetAttempt + risk rules
    │
    └── infrastructure/                 # Infrastructure layer — Data access
        ├── data/
        │   └── models.py              # All Django ORM models (production tables)
        ├── repositories/               # Concrete repository implementations (8 repos)
        │   ├── dashboard_repository.py # Dashboard aggregations (22KB, 537 lines)
        │   └── ...                     # (Other repository files)
        ├── migrations/                 # Migrations for infrastructure models (0001–0009)
        └── management/commands/        # Custom manage.py utilities
```

---

## C. Tech Stack

**Backend**
- Python 3.9+
- Django 4.2
- Django REST Framework 3.14+
- drf-spectacular 0.27+ (OpenAPI 3.0 schema + Scalar UI)
- django-cors-headers 4.3+
- python-dotenv 1.0+
- Pillow 10.0+ (image processing)
- Async Email Service (SMTP via Background Threads)

**Frontend**
- HTML5 & CSS3
- Vanilla JavaScript (ES6+, no framework)
- Lucide Icons (CDN)
- Google Fonts — Inter
- html2canvas (PNG Receipt generation)
- Responsive design: 7 breakpoints (480px → 1440px)

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
To initialize the system with an admin user:
```bash
python manage.py createsuperuser_custom
```

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
| ReDoc | HTTP | `http://localhost:8000/api/redoc/` |
| Django Admin Panel | HTTP | `http://localhost:8000/admin/` |

> **Frontend Serving:** In `DEBUG=True` mode, Django hosts the vanilla frontend directly via a catch-all route. No live-server needed!

---

## G. Key Features

### POS Terminal (`pos.html`)
- Full shopping cart with add/remove/quantity control
- VAT 12% exclusive calculation with discount support (None / 5% Employee / 20% PWD-Senior)
- 4 payment methods: Cash, Card, GCash, Maya
- Real-time stock display on product cards (color-coded)
- Automated receipt image generation (PNG via html2canvas)
- Order history with receipt re-preview
- Change due / short amount calculation

### Admin Dashboard (`dashboard.html`)
- Summary KPI cards: Total Sales, Returns, Products, Profit, Expenses
- Week-over-Week % change indicators
- Monthly sales bar chart (6 period options: 1D, 1W, 1M, 3M, 6M, 1Y)
- Top 5 best-selling products with revenue bars
- Low stock alerts with product images
- Recent sales timeline

### Staff Dashboard (`staffdashboard.html`)
- Weekly earnings with growth % indicator
- Total sales count (all-time + today)
- Payroll projection (weekly + monthly)
- 75 rotating personalized greetings with typing animation
- Best sellers and recent transactions
- Weekly analytics View All modal

### Inventory Management (`managestock.html`)
- Server-side paginated product table (30 per page)
- Stock adjustment: Stock In / Stock Out / Return
- 4-tier stock status: In Stock / Low Stock / Critical / Out of Stock
- Transaction history per product
- Sort controls (name, stock, category)
- Responsive card layout on mobile

### Products (`products.html`)
- Full CRUD: Create, Read, Update, Delete products
- Searchable supplier combobox with auto-fill
- Image upload with UUID rename
- Paginated listing with search and filter

### Sales Records (`sales.html`)
- Live POS sales data display
- Client-side pagination (30 per page)
- Status filtering and search
- Receipt modal preview

### User Management (`usermanagement.html`) — Admin Only
- User listing with pagination
- Create/edit/delete users
- Admin approval workflow for new admin accounts
- Temporary password generation with forced change on next login

---

## H. Security Features

| Feature | Status |
|---|---|
| Django PBKDF2-SHA256 password hashing | ✅ Active |
| Login rate limiting (30 anon / 20 user per min) | ✅ Active |
| Password reset rate limiting (10/hr) | ✅ Active |
| Risk-based reset assessment (progressive lockout) | ✅ Active |
| CSRF middleware | ✅ Active |
| SQL injection prevention (ORM-only, zero raw SQL) | ✅ Active |
| File upload validation (extension whitelist + UUID) | ✅ Active |
| Clickjacking protection (X-Frame-Options DENY) | ✅ Production |
| HSTS + Force HTTPS + Secure Cookies | ✅ Production |
| XSS escaping (`escHtml()` utility) | ⚠️ Partial |
| Content Security Policy | ❌ Pending |
| Full auth token enforcement | ❌ Pending |

> See `readysecurityanddeploymentready.md` for the complete 9-category security audit.

---

## I. Responsive Design

The system uses a 7-breakpoint responsive design:

| Breakpoint | Layout Change |
|---|---|
| ≤ 1440px | Large desktop adjustments |
| ≤ 1200px | Compact sidebar |
| ≤ 1024px | Tablet landscape |
| ≤ 900px | Sidebar overlay mode |
| ≤ 768px | Table → card transformation |
| ≤ 600px | Compact card layout |
| ≤ 480px | Ultra-narrow mobile |

**CSS Files:**
- `responsive.css` (734 lines) — Global breakpoint rules for all pages
- `responsive-cards.css` (239 lines) — Table-to-card transformation for data tables

---

## J. Backup Process

**Soft Deletion & Snapshots**
All administrative deletions (Users, Products, Sales records) are non-destructive:
- Records are intercepted prior to deletion
- A full JSON snapshot is preserved in `api_deletedrecordsbackup`
- Access: Terminal only (prevents UI tampering)

### View Records
```bash
python manage.py show_deleted_records                     # Show all (last 20)
python manage.py show_deleted_records --type=user         # Only users
python manage.py show_deleted_records --type=product      # Only products
python manage.py show_deleted_records --type=sale         # Only sales
python manage.py show_deleted_records --limit=50          # Last 50
python manage.py show_deleted_records --json              # JSON output
```

### Export Records
```bash
python manage.py show_deleted_records --export=sql        # SQL INSERT file
python manage.py show_deleted_records --export=excel      # Excel (.xlsx) with styling
python manage.py show_deleted_records --export=csv        # CSV (Excel-compatible)
python manage.py show_deleted_records --type=product --export=sql   # Filtered export
```

Exported files are saved to the user's **Downloads** folder (`C:\Users\<username>\Downloads\`) with timestamped filenames (e.g., `deleted_records_product_20260416_043220.sql`).

---

## K. Deployment (Production)

> See `readysecurityanddeploymentready.md` for the complete deployment checklist.

### Quick Checklist
```
[ ] Set DJANGO_DEBUG=False in .env
[ ] Generate strong DJANGO_SECRET_KEY
[ ] Set strong DB_PASSWORD
[ ] Set CORS_ALLOW_ALL_ORIGINS=False
[ ] Install and configure Nginx as reverse proxy
[ ] Install Gunicorn: pip install gunicorn
[ ] Obtain SSL certificate (Let's Encrypt)
[ ] Configure Nginx to serve FRONTEND/ static files
[ ] Update API_BASE in all frontend JS files
[ ] Set up automated database backups
```

### Production Architecture
```
Internet/LAN → Cloudflare (optional) → Nginx (SSL + static + proxy)
    → Gunicorn (WSGI, 3 workers) → Django (DEBUG=False)
    → MySQL/PostgreSQL (127.0.0.1 only)
```

---

## L. Development Status

**Overall Status**: Functional and Finalized.
**Last Updated:** 2026-04-16 | **AGENTS.md Version:** 6.0

The Haneus Cafe POS system has completed its stabilization phases in April 2026 with:
- Full responsive UI across all 14 pages (7 breakpoints)
- Comprehensive POS terminal with VAT, discount, and 4 payment methods
- Complete security audit and deployment readiness documentation
- Deep system intelligence documentation (AGENTS.md — 1800+ lines)
- Formula mapping for all financial calculations with calculator examples

---

## M. Documentation Index

| Document | Location | Purpose |
|---|---|---|
| `README.md` | Root | This file — public project documentation |
| `AGENTS.md` | Root | Deep system intelligence — every file, line, formula, connection |
| `RULES.MD` | Root | Development rules & standards (20 sections) |
| `readysecurityanddeploymentready.md` | Root | Security audit & deployment checklist (9 categories) |
| `responsive.md` | Root | 2026 Responsive UI/UX specification |
| `IMP AND ERROR.md` | Root | Implementation log & error resolution history |