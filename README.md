# Haneus Cafe POS — Inventory Management System

> Point of Sale + Inventory Management System for Haneus Cafe.
> Supports **Admin** and **Staff** roles with a Clean Architecture Django backend and a Vanilla JS multi-page frontend.

---

## A. Architecture Type

**System Architecture:** Multi-tier Clean Architecture

- **Frontend:** Multi-page static frontend (HTML/CSS/Vanilla JS) — no framework, no SPA router
- **Backend:** Django REST Framework API with Clean Architecture (4 layers: Domain, Application, Infrastructure, API/Controller)
- **Database:** Relational database — MySQL via XAMPP (default) or SQL Server via SSMS (configurable)
- **Communication:** Frontend calls backend via `fetch()` REST API over HTTP/JSON
- **Auth:** Token-based session stored in browser `localStorage`

**Clean Architecture Layers:**

```
┌─────────────────────────────────────────────────────┐
│  API LAYER         BACKEND/api/controllers/          │  HTTP only — parses request, calls service
├─────────────────────────────────────────────────────┤
│  APPLICATION       BACKEND/application/services/     │  Business logic, use-cases, DTOs
├─────────────────────────────────────────────────────┤
│  INFRASTRUCTURE    BACKEND/infrastructure/           │  ORM models, concrete repositories
├─────────────────────────────────────────────────────┤
│  DOMAIN            BACKEND/domain/entities/          │  Pure Python entities, zero framework deps
└─────────────────────────────────────────────────────┘
```

**Dependency Rule:** API → Application → Infrastructure ↔ Domain. Upper layers never depend on lower layers.

---

## B. Project Structure

```
Inventory-Management-System-Haneus-Cafe-POS-/
├── README.md                          ← Public project documentation
├── index.html                         ← Root redirect to login
├── .env.example                       ← Root environment variable template
├── .gitignore
├── metadata.json
│
├── .github/
│   └── workflows/
│       └── django.yml                 ← Django CI/CD workflow
│
├── FRONTEND/
│   ├── login.html                     ← Login + forgot password + forced password change
│   ├── register.html                  ← User registration
│   ├── dashboard.html                 ← Admin dashboard + embedded POS terminal
│   ├── staffdashboard.html            ← Staff-only dashboard
│   ├── products.html                  ← Product catalog (12/page client-side pagination)
│   ├── createproduct.html             ← Create / edit product form
│   ├── sales.html                     ← Sales records (15/page client-side pagination)
│   ├── managestock.html               ← Stock adjustment (30/page server-side pagination)
│   ├── lowstock.html                  ← Low-stock alerts listing
│   ├── profile.html                   ← User profile + password change + picture upload
│   ├── usermanagement.html            ← Admin/Staff user management (10/page pagination)
│   ├── user.html                      ← User detail view
│   ├── supplier.html                  ← Supplier references
│   ├── reset-password.html            ← Token-based password reset page
│   ├── css/
│   │   ├── sidebar.css                ← Shared sidebar layout (all pages)
│   │   ├── dashboard.css              ← Dashboard + POS layout
│   │   ├── staffdashboard.css         ← Staff dashboard layout
│   │   ├── login.css                  ← Login form styles
│   │   ├── register.css               ← Registration form styles
│   │   ├── products.css               ← Product card grid styles
│   │   ├── createproduct.css          ← Product form styles
│   │   ├── sales.css                  ← Sales table + summary cards
│   │   ├── managestock.css            ← Stock management table
│   │   ├── lowstock.css               ← Low stock page styles
│   │   ├── profile.css                ← Profile card styles
│   │   ├── usermanagement.css         ← User management table
│   │   ├── user.css                   ← User detail styles
│   │   ├── supplier.css               ← Supplier page styles
│   │   └── payment-modals.css         ← POS payment modal styles
│   ├── js/
│   │   ├── sidebar-toggle.js          ← Shared: desktop collapse + mobile overlay
│   │   ├── role-control.js            ← Shared: role-based page access guard
│   │   ├── logout-modal.js            ← Shared: logout confirmation
│   │   ├── alert-modal.js             ← Shared: custom alert utility
│   │   ├── login.js                   ← Login POST + forgot password + forced change modal
│   │   ├── register.js                ← Registration POST + input normalization
│   │   ├── dashboard.js               ← Dashboard metrics + bar chart
│   │   ├── pos.js                     ← POS engine: cart, VAT 12%, receipt PNG
│   │   ├── products.js                ← Product CRUD + client-side pagination
│   │   ├── createproduct.js           ← Create/edit product form
│   │   ├── sales.js                   ← Sales table + client-side pagination
│   │   ├── managestock.js             ← Stock adjust + server-side pagination
│   │   ├── lowstock.js                ← Low-stock listing
│   │   ├── profile.js                 ← Profile view/edit + picture upload
│   │   ├── usermanagement.js          ← User CRUD + pagination + reset password
│   │   ├── supplier.js                ← Supplier reference frontend
│   │   └── reset-password.js          ← Token-based password reset
│   └── images/
│       ├── coffee.png
│       └── coffee1.png
│
└── BACKEND/
    ├── manage.py                      ← Django management entry point
    ├── requirements.txt               ← Python dependencies
    ├── setup_db.py                    ← Interactive database setup wizard
    ├── .env.example                   ← Backend environment variable template
    │
    ├── config/
    │   ├── settings.py                ← All Django settings (DB, DRF, CORS, email, cache)
    │   ├── urls.py                    ← Root URL config — mounts /api/
    │   ├── wsgi.py                    ← WSGI entry point
    │   └── asgi.py                    ← ASGI entry point
    │
    ├── api/                           ← Django app: auth + legacy CRUD
    │   ├── models.py                  ← User, Product, PasswordResetToken, AdminApprovalRequest, DeletedRecordsBackup, Sale
    │   ├── urls.py                    ← Legacy endpoints (upload, products, sales)
    │   ├── views.py                   ← Legacy APIView classes
    │   ├── views_docs.py              ← Scalar documentation view
    │   ├── admin.py                   ← Django admin registrations
    │   ├── throttles.py               ← Custom rate throttle classes
    │   ├── schema_serializers.py      ← OpenAPI schema serializers
    │   ├── user_serializers.py        ← User DRF serializers
    │   ├── product_serializers.py     ← Product DRF serializers
    │   ├── controllers/
    │   │   ├── urls.py                ← All /api/ URL patterns
    │   │   ├── user_controller.py     ← Auth, profile, user management
    │   │   ├── product_controller.py  ← Product CRUD v1 + v2
    │   │   ├── order_controller.py    ← Order lifecycle
    │   │   ├── inventory_controller.py← Stock tracking + adjustment
    │   │   ├── sale_controller.py     ← POS sale create/view/compute
    │   │   ├── sales_analytics_controller.py ← Analytics
    │   │   ├── dashboard_controller.py← Dashboard stats + chart
    │   │   ├── password_reset_controller.py  ← Forgot/reset password
    │   │   └── admin_approval_controller.py  ← Admin registration approval
    │   └── migrations/                ← api app migrations (0001–0007)
    │
    ├── application/                   ← Business logic layer
    │   ├── dtos/                      ← Data Transfer Objects (UserDTO, ProductDTO, etc.)
    │   ├── interfaces/                ← Abstract repository contracts
    │   └── services/                  ← UserService, ProductService, InventoryService, etc.
    │
    ├── domain/                        ← Pure Python domain entities (zero framework deps)
    │   └── entities/                  ← user.py, product.py, order.py, sale.py, inventory.py
    │
    └── infrastructure/                ← ORM models + concrete repositories
        ├── data/
        │   ├── models.py              ← All Django ORM models (the actual DB tables)
        │   ├── db_context.py
        │   └── db_init.py
        ├── repositories/              ← Concrete implementations of repository interfaces
        ├── migrations/                ← infrastructure app migrations (0001–0008)
        └── management/commands/       ← Custom management commands
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

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript (ES6+, no framework)
- Lucide Icons (CDN)
- Google Fonts — Inter

**Database**
- MySQL 8.0 via XAMPP (default)
- SQL Server 19 via MSSQL + ODBC Driver 17 (optional, set `DB_ENGINE=mssql`)

**API**
- REST (JSON over HTTP)
- OpenAPI 3.0 schema at `/api/schema/`

**Database Drivers (install separately)**
- MySQL: `pip install mysqlclient`
- SQL Server: `pip install mssql-django pyodbc`

---

## D. Backend Setup

### 1. Prerequisites

- Python 3.9+
- MySQL running via XAMPP **or** SQL Server via SSMS 19
- `pip`

### 2. Navigate to backend and create virtual environment

```bash
cd BACKEND
python -m venv venv
venv\Scripts\activate        # Windows PowerShell
# source venv/bin/activate   # macOS / Linux
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt

# MySQL (XAMPP) — also install the DB driver:
pip install mysqlclient

# SQL Server — install driver instead:
pip install mssql-django pyodbc
```

### 4. Configure environment

**Option A — Interactive setup wizard (recommended):**
```bash
python setup_db.py
```
Choose A for MySQL / B for SQL Server. The script writes `BACKEND/.env` and creates the database automatically.

**Option B — Manual setup:**
Copy `BACKEND/.env.example` to `BACKEND/.env` and fill in the values:
```
DB_ENGINE=mysql
DB_NAME=haneuscafedb
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
```

### 5. Start the development server

```bash
python manage.py runserver
```

Server will be available at `http://localhost:8000`.

---

## E. Database Migration Setup

### Run Migrations

```bash
python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate
```

### Custom Aliases (EF-style)

```bash
python manage.py add_migration       # alias for makemigrations
python manage.py update_database     # alias for migrate
python manage.py migrate_data        # data migration helper
```

### Initialization Steps

The database `haneuscafedb` is created automatically by `setup_db.py` or by running `python manage.py migrate` after configuring `.env`.

### Migration History

**api app migrations:**
- `0001_initial` — User model (AbstractUser extension)
- `0002_user_avatar_url_user_phone` — Added phone, avatar_url
- `0003_user_user_type` — Added user_type (Admin/Staff)
- `0004_user_password_reset_fields` — Added require_password_change, temporary_password_hash
- `0005_product_supplier_order` — Added supplier fields to Product, Sale model
- `0006_passwordresettoken` — PasswordResetToken model
- `0007_add_performance_indexes` — DB indexes for performance

**infrastructure app migrations:**
- `0001_initial` — UserAdminModel, UserStaffModel, ProductModel, OrderModel, OrderItemModel
- `0002_useradminmodel` — UserAdmin role table
- `0003_salemodel` — SaleModel table
- `0004_saleitemmodel` — SaleItemModel table
- `0005_alter_salemodel` — SaleModel field updates
- `0006_alter_productmodel` — ProductModel field updates
- `0007_salemodel_fields` — Additional sale fields (receipt_number, cashier_name, etc.)
- `0008_add_performance_indexes` — Composite indexes for dashboard queries

### Seeding Process

No automated seeder — products and users are created through the application (API or Django admin at `http://localhost:8000/admin/`).

---

## F. Ports and Access Links

| Service | Port | URL |
|---|---|---|
| Django Backend (dev server) | 8000 | `http://localhost:8000` |
| Django Admin Panel | 8000 | `http://localhost:8000/admin/` |
| Scalar API Docs v1 (canonical) | 8000 | `http://localhost:8000/api/scaler/v1` |
| Scalar API Docs (legacy alias) | 8000 | `http://localhost:8000/api/docs/` |
| OpenAPI 3.0 Schema (YAML) | 8000 | `http://localhost:8000/api/schema/` |
| ReDoc API Documentation | 8000 | `http://localhost:8000/api/redoc/` |
| API Root | 8000 | `http://localhost:8000/api/` |
| Frontend (browser) | N/A | Open `FRONTEND/login.html` directly or serve via VS Code Live Server on `http://localhost:5500` |
| MySQL Database | 3306 | `127.0.0.1:3306` (XAMPP) |
| SQL Server Database | 1433 | `localhost:1433` (SSMS) |

---

## G. Backup Process

### How Deleted Records are Stored

When any user, product, or sale is deleted through the system, the complete record is automatically backed up **before** the deletion occurs.

**Backup Table:** `api_deletedrecordsbackup`

**What is stored:**
- `record_type` — Type of deleted record: `user`, `product`, or `sale`
- `original_id` — The primary key of the deleted record
- `data` — Full JSON snapshot of the record at the time of deletion (all fields preserved)
- `deleted_at` — Timestamp of deletion
- `deleted_by` — FK to the User who performed the deletion

**Access:** Backend-only — this table is **never exposed through any API endpoint**. There is no UI for this data. It is an audit/recovery trail only.

**To inspect deleted records via CLI:**
```bash
# Show all deleted records
python manage.py show_deleted_records

# Filter by type
python manage.py show_deleted_records --type=user
python manage.py show_deleted_records --type=product
python manage.py show_deleted_records --type=sale
```

**Database Indexes on backup table:**
- `idx_deleted_record_type` — Fast filter by record type
- `idx_deleted_type_time` — Fast time-based audit queries

---

## H. System Overview

### What This System Is

**Haneus Cafe POS** is a full-stack Point of Sale and Inventory Management System built for Haneus Cafe. It replaces manual processes with a digital system for tracking products, recording sales, managing stock, and administering users.

### Modules Included

**Authentication & Access Control**
- Role-based system: Admin (full access) and Staff (limited access)
- Secure login with session stored in localStorage
- Password reset via email (token-based, SHA-256 hashed, 60-min expiry)
- Admin-initiated temporary password reset with forced change on next login
- Admin registration requires approval from an existing Admin

**Dashboard**
- Real-time KPIs: total revenue, number of orders, product count, profit
- Sales trend bar chart (daily/weekly/monthly periods)
- Low-stock notification badge

**POS Terminal**
- Embedded in the Admin dashboard
- Product category tabs + search
- Cart with quantity controls
- VAT 12% exclusive calculation
- Cash / Card / GCash / Maya payment methods
- Receipt generation (PNG download via html2canvas)
- Customer number auto-increment

**Product Management**
- Full CRUD for products
- Categories: Beverages, Desserts, Pastries, Ingredients/Supplies, Merchandise
- Low-stock threshold per product
- Supplier name and contact info per product
- Product image URL support
- Client-side pagination (12 products/page)

**Inventory Management**
- Stock adjustment log (stock_in, stock_out, adjustment, return)
- Transaction history per product
- Low-stock alerts page
- Server-side pagination (30 products/page)

**Sales Analytics**
- Sales records with filtering
- Today / this week / pending orders / average order metrics
- Client-side pagination (15 records/page)

**User Management (Admin only)**
- Create, edit, delete Admin and Staff accounts
- Admin can reset any user's password (generates temporary password)
- User management table with client-side pagination (10 users/page)

**Profile Management**
- View and edit own profile (name, email, phone, bio, avatar)
- Profile picture upload and persistence
- Password change (verifies current password)

**Backup & Audit**
- All deleted records (users, products, sales) are backed up to the `api_deletedrecordsbackup` table
- Backend-only access — no UI exposure

### User Roles

| Role | Access |
|---|---|
| **Admin** | Full access: dashboard, POS, products, sales, inventory, user management, supplier management, profile |
| **Staff** | Limited access: staff dashboard, POS, products (view), sales (view), inventory (view), profile |
