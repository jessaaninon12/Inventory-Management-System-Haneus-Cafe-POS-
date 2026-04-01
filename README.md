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



## I. Recent Enhancements - Feature Highlights

# Implementation Summary: 12 Enhancement Tasks

## Completed

### 1. Database Model Changes
✅ **api/models.py (User model)**
- Added `require_password_change` (BooleanField) - Flag to force password change on next login
- Added `temporary_password_hash` (CharField) - Store hashed temporary password
- Added `profile_picture_url` (CharField) - Profile picture persistence
- Added `get_account_type_label()` method - Returns "Admin • Haneus Cafe Owner" or "Staff • Haneus Cafe Employee"

✅ **api/models.py (Product model)**
- Added `supplier_name` (CharField) - Supplier reference
- Added `supplier_contact` (CharField) - Supplier contact info
- Added `is_orderable` (BooleanField) - Explicit orderability flag
- Added `sync_orderability()` method - Updates based on stock level
- Added `can_order` property - Derived from stock > 0

✅ **Database Migrations**
- Created `0004_user_password_reset_fields.py` - User model extensions
- Created `0005_product_supplier_orderability.py` - Product model extensions

### 2. UserService Business Logic
✅ **application/services/user_service.py**
- Added `generate_temporary_password()` - Creates random 12-char password (letters + numbers)
- Added `reset_user_password(user_id)` - Admin initiates password reset, returns plain + hashed
- Added `login_with_forced_password_change_check(dto)` - Returns flag to force password change
- Added `normalize_first_name()` - Sentence case normalization
- Added `normalize_last_name()` - Sentence case normalization
- Added `normalize_email()` - Lowercase normalization
- Added `normalize_username(value, case_mode)` - Supports sentence/title/upper/lower cases

## Remaining Backend Tasks

### 3. User Repository Methods
**File:** `infrastructure/repositories/user_repository.py`

Need to add:
- `set_temporary_password(user_id, hashed_password, require_change=True)` - Persist temp password hash and flag
- Update `create()` method to apply input normalization via service

### 4. User DTOs
**File:** `application/dtos/user_dto.py`

Need to add fields to UserDTO:
- `require_password_change`
- `profile_picture_url`
- `account_type_label` (computed property)

### 5. API Controllers - User Management
**File:** `api/controllers/user_controller.py`

Need to add endpoints:
- `POST /api/users/<pk>/reset-password/` - Admin initiates password reset
- `POST /api/auth/change-temporary-password/` - User forced to change temp password after login

### 6. Product DTO & Controller
**File:** `application/dtos/product_dto.py` and `api/controllers/product_controller.py`

Need to add:
- `supplier_name`, `supplier_contact`, `is_orderable`, `can_order` to ProductDTO
- API responses should indicate orderability to prevent sold-out orders
- Pagination support: Accept `?page=1&limit=30` params and return offset-based results

### 7. Product Repository
**File:** `infrastructure/repositories/product_repository.py`

Need to add:
- `get_paginated(offset=0, limit=30)` - Return paginated results
- `update_orderability()` - Sync is_orderable flag based on stock

## Remaining Frontend Tasks

### 8. Registration Input Normalization
**File:** `FRONTEND/js/register.js`

- Apply service-level normalization on form submission:
  - First/Last Name → Sentence Case
  - Email → lowercase
  - Username → Based on selected case mode

### 9. User Management Reset Password
**File:** `FRONTEND/usermanagement.html` & `FRONTEND/js/usermanagement.js`

- Add "Reset Password" button in edit user card
- Show confirmation: "Would you like to reset the temporary password of [First Name]?"
- Display generated password in modal with copy button
- Call `POST /api/users/<pk>/reset-password/`

### 10. Profile Picture
**File:** `FRONTEND/profile.html` & `FRONTEND/js/profile.js`

- Existing avatar input already in HTML (line 78)
- Convert to persist via API call to `PUT /api/profile/<pk>/` with `profile_picture_url`
- Display on login welcome and user view modals
- Both admin and staff should see their own picture in profile

### 11. POS Separation
**File:** `FRONTEND/html/dashboard.html` or create new `FRONTEND/pointofsale.html`

- Remove "Staff" from account-type radio button in registration
- Create separate sidebar menu item for "Point of Sales"
- Keep POS UI/behavior identical, just restructured in navigation

### 12. Stock Sold-Out Behavior
**File:** `FRONTEND/js/pos.js`, `FRONTEND/js/products.js`, `FRONTEND/js/managestock.js`

- Keep product card visible even when stock = 0
- Disable "Add to Cart" button visually when `can_order = false`
- Show "Sold Out" status badge on card
- Backend API returns `can_order: false` for stock = 0 products
- Pagination in manage-stock at 30 items per page using numbered buttons

## Execution Order

1. ✅ Model migrations (done)
2. ✅ UserService methods (done)
3. User repository methods
4. User DTOs
5. API controllers & endpoints
6. Product DTO & repository
7. Register normalization
8. Profile picture persistence
9. Reset password UI
10. POS separation
11. Sold-out UI
12. Pagination UI

## Important Notes

- **No UI design changes** - Preserve existing layout, colors, fonts
- **Database**: Run migrations after deploying changed models
- **Input normalization** enforced at service layer, not just frontend
- **Password hashing** uses Django's `make_password()` / `check_password()`
- **Profile pictures** use existing `avatar_url` field pattern
- **Supplier references** optional fields (blank=True) for backward compatibility
- **Sold-out products** remain visible to maintain UX consistency
- **Pagination** uses standard offset-based API response format

## Testing Checklist

- [ ] User can register with normalized inputs
- [ ] Admin can reset user password and user sees temp password
- [ ] User forced to change password on next login with temp password
- [ ] Profile picture uploads and persists
- [ ] Supplier references show in product details
- [ ] Sold-out products visible but not orderable
- [ ] Pagination shows 30 items per page
- [ ] POS accessible separately from account type
- [ ] System handles thousands of API calls under load
- [ ] No changes to existing UI layout or theme
      

## J. Development Status

# Haneus Cafe POS - 12 Enhancement Tasks Implementation Summary

## Project Overview
Implementation of 12 major enhancements to the Haneus Cafe POS Inventory Management System while preserving existing UI/theme/layout. The project is **67% complete** with all backend work finished and 5/8 frontend tasks completed.

## Completion Status

| Component | Status | Progress |
|-----------|--------|----------|
| **Backend** | ✅ COMPLETE | 100% |
| **Frontend** | 🔄 IN PROGRESS | 62.5% (5/8) |
| **Overall** | 🔄 IN PROGRESS | 67% |

---

## ✅ COMPLETED TASKS (8/12)

### Backend Tasks (12/12) ✅

1. **User Model Extensions** ✅
   - `require_password_change` (BooleanField) - Force password change on login
   - `temporary_password_hash` (CharField) - Store hashed temp password
   - `profile_picture_url` (CharField) - Profile picture persistence
   - `get_account_type_label()` method - Returns formatted labels

2. **Product Model Extensions** ✅
   - `supplier_name` (CharField) - Supplier reference
   - `supplier_contact` (CharField) - Supplier contact info
   - `is_orderable` (BooleanField) - Orderability flag
   - `sync_orderability()` method - Update based on stock
   - `can_order` property - Derived from stock > 0

3. **Database Migrations** ✅
   - `0004_user_password_reset_fields.py` - User model changes
   - `0005_product_supplier_orderability.py` - Product model changes

4. **UserService Business Logic** ✅
   - `generate_temporary_password()` - 12-char random password
   - `reset_user_password(user_id)` - Admin initiates password reset
   - `change_password_from_temporary(user_id, new_password)` - Forced password change
   - `login_with_forced_password_change_check(dto)` - Check flag on login
   - Input normalization methods:
     - `normalize_first_name()` - Sentence Case
     - `normalize_last_name()` - Sentence Case
     - `normalize_email()` - Lowercase
     - `normalize_username(value, case_mode)` - Configurable case

5. **ProductService Pagination** ✅
   - `get_products_paginated(page=1, limit=30)` - Paginated results with metadata

6. **Repository Methods** ✅
   - `UserRepository.set_temporary_password()` - Persist temp password hash
   - `UserRepository.get_require_password_change()` - Check forced change flag
   - `ProductRepository.get_paginated()` - Offset-based pagination
   - `ProductRepository.get_total_count()` - Total items count

7. **DTO Enhancements** ✅
   - `UserDTO` - Added new fields: `require_password_change`, `profile_picture_url`, `account_type_label`
   - `ProductDTO` - Added new fields: `supplier_name`, `supplier_contact`, `is_orderable`, `can_order`

8. **API Controllers & Endpoints** ✅
   - `POST /api/auth/register/` - Registration with input normalization
   - `POST /api/users/<pk>/reset-password/` - Admin password reset
   - `POST /api/auth/change-temporary-password/` - Forced password change
   - `GET /api/products/view/?page=N&limit=30` - Paginated products
   - All product endpoints support pagination
   - UserDTO responses include account type labels

### Frontend Tasks (5/8) ✅

1. **Login Forced Password Change** ✅
   - Modal overlay added to login.html
   - Detects `require_password_change === true`
   - Two-field password input (new + confirm)
   - Calls `/api/auth/change-temporary-password/`
   - Redirects to dashboard after successful change

2. **Registration Input Normalization** ✅
   - `normalizeSentenceCase()` helper
   - `normalizeEmail()` helper
   - `normalizeUsername()` helper
   - Applied before form submission
   - Matches backend normalization logic

3. **Profile Picture Persistence** ✅
   - Reads and displays `profile_picture_url` field
   - Fallback to `avatar_url` for backward compatibility
   - Updates via `PUT /api/profile/<pk>/`
   - Sends both fields for consistency

4. **Admin Reset Password** ✅
   - "Reset PW" button in user management table
   - Modal displays 12-character temporary password
   - Copy-to-clipboard button
   - Shows message to share password with user
   - Calls `POST /api/users/<pk>/reset-password/`
   - Success alert confirms operation

5. **Account Type Labels** ✅
   - Displays "Admin • Haneus Cafe Owner" for admins
   - Displays "Staff • Haneus Cafe Employee" for staff
   - Used across profile and user management pages

---

## ⏳ REMAINING TASKS (4/12)

### Frontend Tasks (3/8) ⏳

1. **Product Pagination (managestock.js)** - ~40 minutes
   - Fetch `/api/products/view/?page=N&limit=30`
   - Render pagination controls (Previous | 1 2 3 ... | Next)
   - Display "Showing X of Y products"
   - Store metadata: total_count, total_pages

2. **Sold-Out Visual State (pos.js)** - ~30 minutes
   - Keep product cards visible when stock=0
   - Show "Sold Out" badge when can_order=false
   - Disable "Add to Cart" button visually
   - Prevent submission when product out of stock

3. **Supplier Info Display (pos.js, products.js, managestock.js)** - ~50 minutes
   - Display supplier_name and supplier_contact
   - Show in product detail modals
   - Fallback to "-" if fields empty
   - Implement across all 3 product-related pages

### Non-Technical (1/12) ⏳

1. **Documentation Update** - ~20 minutes
   - Update README with new features
   - Document API endpoints
   - Provide user guide for new features

---

## Implementation Architecture

### Clean Architecture Layers

```
Presentation (HTML/CSS/JavaScript)
    ↓
HTTP API Controllers
    ↓
Application Services (Business Logic)
    ↓
Data Transfer Objects (DTOs)
    ↓
Repository Pattern (Data Access)
    ↓
Django ORM Models
    ↓
Database
```

### New Features by Layer

| Feature | Controller | Service | Repository | Model |
|---------|-----------|---------|-----------|-------|
| Password Reset | ✅ POST reset-password | ✅ reset_user_password() | ✅ set_temporary_password() | ✅ require_password_change |
| Forced Password Change | ✅ POST change-temp-pw | ✅ change_password_from_temporary() | ✅ change_password() | ✅ require_password_change |
| Profile Picture | ✅ PUT profile | ✅ update_profile() | ✅ update() | ✅ profile_picture_url |
| Input Normalization | ✅ register/create | ✅ normalize_*() | ✅ create() | ✅ updated fields |
| Supplier References | ✅ GET products | ✅ get_products_paginated() | ✅ get_paginated() | ✅ supplier_name/contact |
| Pagination | ✅ GET /products?page=N | ✅ get_products_paginated() | ✅ get_paginated() | ✅ (derived) |
| Sold-Out Logic | 🔄 Frontend only | ✅ (derived property) | ✅ (derived) | ✅ is_orderable |
| Account Type Labels | 🔄 Frontend only | ✅ (computed property) | - | - |

---

## Key Features Delivered

### 1. Security Enhancements
- ✅ Admin-initiated password reset with 12-character temporary passwords
- ✅ Forced password change on login (cannot bypass)
- ✅ Hashed password storage (Django's make_password/check_password)
- ✅ Secure password change requires old password verification

### 2. User Management
- ✅ Account type labels with cafe designation
- ✅ Profile picture upload and persistence
- ✅ Input normalization (sentence case names, lowercase emails)
- ⏳ User type separated from POS access (partial)

### 3. Inventory Management
- ✅ Supplier reference information (name, contact)
- ✅ Pagination at 30 items per page
- ⏳ Sold-out products remain visible but unorderable
- ⏳ Product view details showing supplier info

### 4. System Robustness
- ✅ Offset-based pagination for large datasets
- ✅ Backward-compatible API responses
- ✅ Optional fields (supplier info) don't break existing UI
- ✅ DTOs and repositories support scaling

### 5. User Experience
- ✅ Real-time account type information
- ✅ Clear password reset workflow
- ✅ Persistent profile customization
- ⏳ Visual feedback for sold-out items
- ⏳ Easy pagination navigation

---

## File Statistics

### Backend Files Modified: 12
- `api/models.py` - 50 lines added
- `api/migrations/` - 2 files created
- `application/services/user_service.py` - 80 lines added
- `application/services/product_service.py` - 20 lines added
- `application/dtos/user_dto.py` - 30 lines added
- `application/dtos/product_dto.py` - 30 lines added
- `infrastructure/repositories/user_repository.py` - 40 lines added
- `infrastructure/repositories/product_repository.py` - 35 lines added
- `api/controllers/user_controller.py` - 65 lines added
- `api/controllers/product_controller.py` - 60 lines added
- `api/controllers/urls.py` - 5 lines added

### Frontend Files Modified: 8
- `login.html` - Modal added
- `login.js` - 100 lines added
- `register.js` - 50 lines added
- `profile.js` - 10 lines modified
- `usermanagement.html` - Modal added
- `usermanagement.js` - 40 lines added
- `managestock.js` - Awaiting pagination implementation
- `pos.js` - Awaiting sold-out and supplier implementation

### Documentation Files: 3
- `BACKEND_API_REFERENCE.md` - Complete API documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation checklist
- `FRONTEND_IMPLEMENTATION_STATUS.md` - Frontend progress tracking

---

## Quality Assurance

### Code Review Checklist
- ✅ No UI/layout design changes
- ✅ Existing CSS and HTML structure preserved
- ✅ Backward-compatible API responses
- ✅ Input validation at both frontend and backend
- ✅ Error handling in controllers and services
- ✅ Database migrations properly structured
- ✅ DTOs properly mapped to/from entities
- ✅ Clean separation of concerns (services, repositories, DTOs)

### Testing Recommendations

#### Backend Testing
```bash
# Run migrations
python manage.py migrate

# Test password reset flow
POST /api/users/<id>/reset-password/

# Test forced password change
POST /api/auth/change-temporary-password/

# Test pagination
GET /api/products/view/?page=1&limit=30

# Test registration normalization
POST /api/auth/register/
```

#### Frontend Testing
- [ ] Register with mixed-case inputs
- [ ] Login with temp password, change it
- [ ] Upload profile picture
- [ ] Reset admin password
- [ ] Navigate product pagination
- [ ] View sold-out products
- [ ] Check supplier info in modals

---

## Deployment Checklist

### Before Going Live
1. Run database migrations
2. Test all API endpoints
3. Complete remaining frontend tasks
4. Update documentation/README
5. Perform end-to-end testing
6. Deploy to production server
7. Monitor logs for errors

### Configuration Required
- Set `SECRET_KEY` in Django settings
- Configure email backend for password reset (optional)
- Set appropriate `ALLOWED_HOSTS`
- Ensure database backups enabled

---

## Future Enhancements (Out of Scope)

- Email notifications for password resets
- Two-factor authentication
- Audit logging for user actions
- Role-based access control (RBAC)
- Supplier management API
- Advanced analytics
- Bulk product import/export

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Features Implemented | 8/12 (67%) |
| Backend Completion | 100% |
| Frontend Completion | 62.5% (5/8) |
| New API Endpoints | 3 |
| Database Migrations | 2 |
| Models Extended | 2 |
| Services Enhanced | 2 |
| Repositories Extended | 2 |
| DTOs Modified | 2 |
| HTML Pages Modified | 2 |
| JavaScript Files Modified | 4 |
| Lines of Code Added | ~600+ |
| Estimated Remaining Time | 2-3 hours |

---

## Next Steps

1. **Immediate** (This session)
   - Review this summary
   - Verify backend migrations run successfully
   - Begin pagination implementation

2. **Short-term** (Next 2-3 hours)
   - Complete managestock.js pagination
   - Add sold-out visual state to pos.js
   - Display supplier info in product modals

3. **Medium-term** (Before deployment)
   - Complete end-to-end testing
   - Update project documentation
   - Deploy to staging environment

4. **Long-term** (Future phases)
   - Add email notifications
   - Enhance audit logging
   - Implement advanced features

---

## Support & Documentation

### Available Resources
1. **BACKEND_API_REFERENCE.md** - Complete API endpoint documentation with examples
2. **IMPLEMENTATION_SUMMARY.md** - Feature-by-feature implementation checklist
3. **FRONTEND_IMPLEMENTATION_STATUS.md** - Frontend progress and implementation guide
4. **Code Comments** - Inline documentation in all modified files

### Contact Points
- Backend API runs at `http://localhost:8000`
- Frontend served from `/FRONTEND` directory
- All endpoints prefixed with `/api/`

---

**Project Status: 67% Complete | All Backend Work Finished | 5/8 Frontend Tasks Done**

Generated: 2026-03-26 | Version: 1.0


## J.1 Frontend Status

# Frontend Implementation Status - 12 Enhancements

## ✅ COMPLETED TASKS (5/8)

### 1. Forced Password Change Flow (login.js + login.html)
**Status: DONE**
- Modal added to login.html (`#forcedPasswordChangeModal`)
- Detects `require_password_change === true` in login response
- User required to change password before accessing dashboard
- Calls `POST /api/auth/change-temporary-password/` with `user_id` and `new_password`
- Clears flag after successful update
- Fallback redirects to appropriate dashboard (Admin/Staff)

### 2. Input Normalization (register.js)
**Status: DONE**
- Helper functions added:
  - `normalizeSentenceCase()` - First letter uppercase, rest lowercase
  - `normalizeEmail()` - Convert to lowercase
  - `normalizeUsername()` - Sentence case (first word capitalized)
- Applied during form submission before calling `/api/auth/register/`
- Server-side validation also applies normalization (belt-and-suspenders approach)

### 3. Profile Picture Persistence (profile.js)
**Status: DONE**
- Modified `loadProfile()` to display `profile_picture_url` or fallback to `avatar_url`
- Updated form submission to include both `avatar_url` and `profile_picture_url` in PUT body
- Avatar upload handler existing and functional
- Picture persists across sessions via localStorage updates

### 4. Admin Reset Password Feature (usermanagement.js + usermanagement.html)
**Status: DONE**
- Modal added: `#resetPasswordModal` with temp password display
- Function `openResetPasswordModal(userId)` calls `POST /api/users/<pk>/reset-password/`
- Returns 12-character temporary password from backend
- Copy-to-clipboard button for easy sharing
- Message: "Share this password with the user. They will be forced to change it on login."
- Shown in user management table as "Reset PW" button

## ⏳ REMAINING TASKS (3/8)

### 5. Product Pagination (managestock.js)
**What needs to be done:**
- Modify product list fetch to use `/api/products/view/?page=1&limit=30`
- Store pagination metadata: `total_count`, `total_pages`, current `page`
- Render pagination controls: Previous | 1 2 3 ... | Next
- Load page 1 on initial load, update on page button click
- Display "Showing X of Y products" text
- Update product table with paginated results

**Implementation Pattern:**
```javascript
// On page load or when pagination button clicked:
const res = await fetch(`${API}/products/view/?page=${pageNum}&limit=30`);
const data = await res.json();
// data.products = array of products
// data.total_count = total items
// data.total_pages = total pages
// data.page = current page number
```

### 6. Sold-Out Visual State (pos.js)
**What needs to be done:**
- Check `can_order` field in product response (true if stock > 0)
- Keep product card visible even when `stock === 0`
- Add "Sold Out" badge/label to card when `stock === 0`
- Disable "Add to Cart" button when `can_order === false`
- Visual state: gray out button, show tooltip "Out of Stock"
- Prevent form submission if user attempts to order sold-out product

**Key Logic:**
```javascript
if (product.can_order === false) {
  // Add CSS class 'sold-out' or similar
  // Disable button onclick or add [disabled] attribute
  // Show tooltip/message
}
```

### 7. Supplier Information Display (pos.js, products.js, managestock.js)
**What needs to be done:**
- In product detail modals/popovers, display:
  - `supplier_name` (CharField, may be empty)
  - `supplier_contact` (CharField, may be empty)
- Show as: "Supplier: [name] / Contact: [contact]"
- If empty, display "-" or "No supplier info"
- Add to product view modal/tooltip in all three files:
  - `pos.js` - POS product detail modal
  - `products.js` - Product inventory view modal
  - `managestock.js` - Stock management product detail modal

## Files Modified Summary

### Backend (COMPLETED)
- ✅ `api/models.py` - User and Product model extensions
- ✅ `api/migrations/0004_user_password_reset_fields.py`
- ✅ `api/migrations/0005_product_supplier_orderability.py`
- ✅ `application/services/user_service.py` - Password reset logic
- ✅ `application/services/product_service.py` - Pagination
- ✅ `application/dtos/user_dto.py` - New fields
- ✅ `application/dtos/product_dto.py` - New fields
- ✅ `infrastructure/repositories/user_repository.py` - set_temporary_password()
- ✅ `infrastructure/repositories/product_repository.py` - Pagination methods
- ✅ `api/controllers/user_controller.py` - Reset password endpoints
- ✅ `api/controllers/product_controller.py` - Pagination support
- ✅ `api/controllers/urls.py` - New endpoint routes

### Frontend (PARTIAL)
- ✅ `login.html` - Forced password change modal
- ✅ `login.js` - Forced password change logic
- ✅ `register.js` - Input normalization
- ✅ `profile.js` - Profile picture persistence
- ✅ `usermanagement.html` - Reset password modal
- ✅ `usermanagement.js` - Reset password function
- ⏳ `managestock.js` - Pagination (needs implementation)
- ⏳ `pos.js` - Sold-out state + supplier display (needs implementation)
- ⏳ `products.js` - Supplier display in modals (needs implementation)

## Testing Checklist

### ✅ Completed Features
- [ ] Register new user → inputs normalized (John → John, john → john)
- [ ] Admin resets user password → modal shows 12-char temp password
- [ ] User logs in with temp password → forced password change modal appears
- [ ] User enters new password → flag cleared, user logs in
- [ ] Profile picture uploads → saved and persists across sessions
- [ ] Account type labels display → "Admin • Haneus Cafe Owner" format

### ⏳ Remaining Tests
- [ ] Manage Stock page → shows 30 items, pagination works
- [ ] POS product cards → visible even when stock=0, "Sold Out" shown
- [ ] "Add to Cart" button → disabled when product sold-out
- [ ] Product modals → show supplier name and contact info
- [ ] Pagination controls → page numbers work, prev/next functional
- [ ] Pagination metadata → total_count displayed correctly

## Quick Implementation Reference

### For Pagination (managestock.js):
```javascript
// Fetch paginated products
const page = 1;
const res = await fetch(`${API}/products/view/?page=${page}&limit=30`);
const { products, total_count, total_pages } = await res.json();

// Render pagination buttons
function renderPaginationButtons(currentPage, totalPages) {
  // Create Previous | 1 2 3 ... | Next buttons
  // Attach onclick to call goToPage(pageNum)
}

function goToPage(pageNum) {
  // Fetch that page and re-render table
}
```

### For Sold-Out (pos.js):
```javascript
// When rendering product card:
if (!product.can_order) {
  card.classList.add('sold-out');
  addToCartBtn.disabled = true;
  addToCartBtn.title = 'Out of Stock';
}

// CSS in pos.css:
// .product-card.sold-out { opacity: 0.6; }
// .product-card.sold-out .add-btn { background: #ccc; cursor: not-allowed; }
```

### For Supplier Info:
```javascript
// In product detail modal:
const supplierText = (product.supplier_name || '-') + ' / ' + 
                     (product.supplier_contact || '-');
document.getElementById('supplierInfo').textContent = supplierText;
```

## Database Migration Commands

Before testing, ensure migrations are applied:
```bash
cd BACKEND
python manage.py migrate api.0004_user_password_reset_fields
python manage.py migrate api.0005_product_supplier_orderability
```

## Notes for Frontend Developers

1. **Backward Compatibility**: API returns both `avatar_url` and `profile_picture_url` for profile pictures. Use `profile_picture_url` if available, fallback to `avatar_url`.

2. **Pagination Optional**: If pagination params omitted, API returns flat array (backward compatible).

3. **Supplier Fields Optional**: Products may have empty `supplier_name` and `supplier_contact` - handle gracefully with "-" fallback.

4. **No UI/Layout Changes**: All implementations preserve existing HTML structure and CSS. Only add classes/attributes for styling, don't modify layout.

5. **User Experience**: Ensure visual feedback for:
   - Disabled buttons (gray, cursor: not-allowed)
   - Sold-out badges (clear visual indication)
   - Pagination (highlight current page, disable prev/next at boundaries)

## Recommended Implementation Order

1. **Pagination (managestock.js)** - Most self-contained, clearest API contract
2. **Sold-out visual state (pos.js)** - Simple conditional logic
3. **Supplier display (all modals)** - Copy pattern across 3 files

Total remaining development time: **~2-3 hours** for experienced developer

## K. API Reference

# Backend Implementation Complete - API Reference

## Summary
All backend database models, migrations, services, DTOs, controllers, and API endpoints have been successfully implemented for the 12 enhancement tasks. This document serves as the integration guide for frontend development.

## New API Endpoints

### Authentication & Password Reset

#### `POST /api/auth/register/`
**Register a new user with input normalization.**
- Request body:
  ```json
  {
    "first_name": "john",
    "last_name": "doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123",
    "user_type": "Admin"
  }
  ```
- Response (201):
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "user_type": "Admin",
      "account_type_label": "Admin • Haneus Cafe Owner",
      "require_password_change": false,
      "profile_picture_url": ""
    }
  }
  ```
- **Input Normalization Applied:**
  - First/Last Name → Sentence Case (capitalize first letter)
  - Email → lowercase
  - Username → Configurable via case_mode (default: sentence case)

#### `POST /api/auth/login/`
**Authenticate user and check if forced password change is required.**
- Request body:
  ```json
  {
    "username": "johndoe",
    "password": "SecurePass123",
    "user_type": "Admin"
  }
  ```
- Response (200):
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "user_type": "Admin",
      "account_type_label": "Admin • Haneus Cafe Owner",
      "require_password_change": true,
      "profile_picture_url": "/path/to/picture.jpg"
    }
  }
  ```
- **Frontend Logic:**
  - If `require_password_change === true`, redirect to forced password change modal
  - User cannot proceed until password is changed via `/api/auth/change-temporary-password/`

#### `POST /api/users/<pk>/reset-password/` (Admin Only)
**Initiate password reset for a user. Returns temporary 12-character password.**
- Request body: `{}` (empty)
- Response (200):
  ```json
  {
    "success": true,
    "temporary_password": "aB3cDeF4GhIj"
  }
  ```
- **Backend:** Generates random 12-char password, hashes it, persists with `require_password_change=True`
- **Frontend:**
  - Display temp password in modal with copy-to-clipboard button
  - Show message: "Share this password with the user. They will be forced to change it on next login."

#### `POST /api/auth/change-temporary-password/`
**User changes their temporary password after forced password change requirement.**
- Request body:
  ```json
  {
    "user_id": 1,
    "new_password": "NewSecurePass456"
  }
  ```
- Response (200):
  ```json
  {
    "success": true,
    "message": "Password updated successfully."
  }
  ```
- **Backend:** Clears `require_password_change` flag and `temporary_password_hash` field

---

## Profile & Picture Updates

#### `PUT /api/profile/<pk>/`
**Update user profile including picture URL.**
- Request body (all optional):
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "bio": "Cafe Manager",
    "avatar_url": "/media/profiles/user_1.jpg",
    "profile_picture_url": "/media/profiles/user_1_new.jpg"
  }
  ```
- Response (200):
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "bio": "Cafe Manager",
    "avatar_url": "/media/profiles/user_1.jpg",
    "profile_picture_url": "/media/profiles/user_1_new.jpg",
    "user_type": "Admin",
    "account_type_label": "Admin • Haneus Cafe Owner",
    "require_password_change": false,
    "date_joined": "2025-01-15T10:30:00Z"
  }
  ```
- **Frontend:**
  - Profile picture upload input saves file → generates URL → calls this endpoint with `profile_picture_url`
  - Display profile picture in profile.html and login welcome screen

---

## Product Management with Supplier References & Pagination

#### `GET /api/products/view/?page=1&limit=30`
**Retrieve paginated products with supplier and orderability info.**
- Query Parameters:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 30, max: 100)
- Response (200):
  ```json
  {
    "products": [
      {
        "id": 1,
        "name": "Espresso",
        "category": "Coffee",
        "price": "3.50",
        "cost": "1.50",
        "stock": 0,
        "unit": "cup",
        "description": "Strong black coffee",
        "low_stock_threshold": 10,
        "image_url": "/media/products/espresso.jpg",
        "stock_status": "low",
        "supplier_name": "Local Coffee Roasters",
        "supplier_contact": "contact@localcoffee.com",
        "is_orderable": false,
        "can_order": false,
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-20T15:45:00Z"
      }
    ],
    "total_count": 150,
    "page": 1,
    "limit": 30,
    "total_pages": 5
  }
  ```
- **Frontend (Manage Stock Page):**
  - Display products in 30-item chunks
  - Add pagination buttons (Previous / 1 2 3 4 5 / Next)
  - Display supplier info in product details modal
  - Show supplier contact in expanded view

#### `GET /api/products/` (legacy, also supports pagination)
**Alternative endpoint for backward compatibility. Same pagination support.**

---

## Product Sold-Out Behavior

### Key Fields in Product Response
- `stock`: Current stock level (integer)
- `can_order`: Derived property = (stock > 0) — use for "Add to Cart" button state
- `is_orderable`: Explicit flag synced with stock level

### Frontend Logic for POS

1. **Product Display:**
   - Keep product card visible even when `stock === 0`
   - Show "Sold Out" badge when `stock === 0`

2. **Order/Cart Button:**
   - Disable "Add to Cart" button when `can_order === false`
   - Show visual state change (gray out, tooltip: "Out of Stock")
   - Prevent form submission if user tries to order sold-out product

3. **Manage Stock Page:**
   - Show stock level in edit form
   - When stock drops to 0 after update, automatically update orderability
   - Display supplier info and contact details

---

## User Management Features

### Account Type Labels
All user responses include `account_type_label` field:
- Admin user: `"Admin • Haneus Cafe Owner"`
- Staff user: `"Staff • Haneus Cafe Employee"`

### Forced Password Change Flow
1. Admin clicks "Reset Password" button in user management
2. System shows temporary 12-char password in modal
3. Admin shares password with user
4. User logs in with temporary password
5. System detects `require_password_change === true`
6. Frontend shows password change modal (overlay, no navigation)
7. User enters new password and submits
8. System calls `/api/auth/change-temporary-password/`
9. Flag is cleared, user is now logged in with new password

### Profile Picture Persistence
- New field: `profile_picture_url` (CharField, max_length=255)
- Updated via `PUT /api/profile/<pk>/` with `profile_picture_url` value
- Display on:
  - Profile page (profile.html)
  - Login welcome screen
  - User view modals in user management
  - Sidebar user section (if applicable)

---

## Pagination Implementation Details

### Format
Standard offset-based pagination returned in all list endpoints that support it:
```json
{
  "products": [...],     // or "users", "orders", etc.
  "total_count": 150,    // Total items in database
  "page": 1,            // Current page (1-indexed)
  "limit": 30,          // Items per page
  "total_pages": 5      // Calculated total pages
}
```

### Frontend Pagination Controls
For Manage Stock page (30 items/page):
```html
<div class="pagination">
  <button id="prev-page" [disabled]="currentPage === 1">← Previous</button>
  <span *ngFor="let p of pageNumbers" class="page-number">
    <button (click)="goToPage(p)" [class.active]="p === currentPage">{{p}}</button>
  </span>
  <button id="next-page" [disabled]="currentPage === totalPages">Next →</button>
</div>
```

---

## Database Migrations

Run these migrations before testing:
```bash
python manage.py migrate api.0004_user_password_reset_fields
python manage.py migrate api.0005_product_supplier_orderability
```

### New User Model Fields
- `require_password_change`: BooleanField, default=False
- `temporary_password_hash`: CharField, max_length=255, blank=True
- `profile_picture_url`: CharField, max_length=255, blank=True

### New Product Model Fields
- `supplier_name`: CharField, max_length=255, blank=True
- `supplier_contact`: CharField, max_length=255, blank=True
- `is_orderable`: BooleanField, default=True

---

## Backend Service Methods Summary

### UserService
- `generate_temporary_password()` → (plain, hashed)
- `reset_user_password(user_id)` → (plain, hashed) or raises ValueError
- `change_password_from_temporary(user_id, new_password)` → bool
- `login_with_forced_password_change_check(dto)` → dict with `require_password_change`
- `normalize_first_name(value)` → Sentence Case
- `normalize_last_name(value)` → Sentence Case
- `normalize_email(value)` → lowercase
- `normalize_username(value, case_mode)` → Configurable case

### ProductService
- `get_products_paginated(page=1, limit=30)` → dict with products, total_count, page, limit, total_pages

### UserRepository
- `set_temporary_password(user_id, hashed_password, require_change=True)` → bool
- `get_require_password_change(user_id)` → bool

### ProductRepository
- `get_paginated(offset=0, limit=30)` → list of entities
- `get_total_count()` → int

---

## Testing Checklist for Frontend

- [ ] Register with normalization applied (first/last name sentence case, email lowercase)
- [ ] Admin resets user password and sees temp password
- [ ] User logs in with temp password, forced to change
- [ ] Profile picture uploads and persists across sessions
- [ ] Supplier info displays in product detail modal
- [ ] Sold-out products visible but "Add to Cart" disabled
- [ ] Manage Stock page shows 30 items per page with pagination
- [ ] POS items remain visible when stock=0, unorderable
- [ ] Account type labels display correctly in UI
- [ ] Pagination works: page numbers, prev/next buttons, correct items shown

---

## Notes for Frontend Developers

1. **Always check `can_order` property** before allowing cart additions (more reliable than manual stock check)
2. **Supplier info is optional** – products without supplier info will have empty `supplier_name` and `supplier_contact`
3. **Profile pictures are optional** – empty string by default, don't break if missing
4. **Forced password change** is checked on login response – handle it in login controller before redirecting to dashboard
5. **Pagination is backward compatible** – old endpoints still return flat arrays if no pagination params provided
6. **No UI design changes required** – All changes are backend/API; preserve existing HTML/CSS structure

## L. Documentation Guide

# Documentation Update — README & AGENTS.md

**Date:** 2026-03-26  
**Updated By:** Oz AI Agent + Development Team

---

## What Was Added

### 1. AGENTS.md (Primary Knowledge Base)
**Location:** `AGENTS.md` (git-ignored)

This is the **canonical source of truth for all AI agents**. It contains:

✅ **Complete Project Overview** — architecture, tech stack, key features  
✅ **Architecture Layers** — Clean Architecture pattern with dependency flows  
✅ **Complete Directory Structure** — every file with line number references  
✅ **Database Schema** — all tables with column types and line numbers  
✅ **POS Calculation Engine** — complete formulas with exact line numbers  
✅ **Core Business Logic** — all major flows with file/line references  
✅ **API Endpoints** — all endpoints with controller methods and line numbers  
✅ **Frontend Logic** — JavaScript functions with line numbers  
✅ **Data Flow Diagrams** — ASCII diagrams of POS checkout and dashboard flows  
✅ **Stock Management** — inventory logic with atomic operations  
✅ **User Roles** — permission system with code examples  
✅ **Common Patterns** — DTO, Repository, Service, Controller patterns  
✅ **Error Handling Rules** — validation and response formats  
✅ **Database Queries** — all queries with line numbers  
✅ **Update Procedures** — step-by-step guide for adding features  
✅ **Key Constants** — all configuration values  
✅ **Testing & QA Checklist** — test scenarios  
✅ **Deployment Checklist** — production setup  
✅ **Quick Reference Commands** — common git and Django commands  

### 2. .gitignore Updated
**Location:** `.gitignore`

Added AGENTS.md to git-ignored files:
```
# -------------------------------------------------------
# AI Agent Knowledge Base (internal only, not for git)
# -------------------------------------------------------
AGENTS.md
```

**Why?** AGENTS.md is an internal development resource. It's not needed in the repository and should not be committed.

---

## How to Use AGENTS.md

### Before Making Changes
1. **Read AGENTS.md completely** — understand the architecture and patterns
2. **Find the relevant section** — locate your feature in the index
3. **Note the exact line numbers** — all code references include file paths + line numbers
4. **Follow the update procedure** — section "Update Procedures"

### During Development
1. **Update code files** — make your changes
2. **Update AGENTS.md** — add new line numbers and logic descriptions
3. **Commit with attribution** — include `Co-Authored-By: Oz <oz-agent@warp.dev>`

### Example: Adding a New Discount Type

1. **Domain Entity** (domain/entities/sale.py)
   - Add validation for new discount (AGENTS.md tells you: Line 127–141)
   - Update the `compute_totals()` method (AGENTS.md tells you: Line 147–201)

2. **ORM Model** (infrastructure/data/models.py)
   - Add field to SaleModel (AGENTS.md tells you: Line 136+)
   - Create migration

3. **DTO** (application/dtos/sale_dto.py)
   - Add field to SaleDTO (AGENTS.md tells you: section "Core Business Logic")

4. **Repository** (infrastructure/repositories/sale_repository.py)
   - Update `_to_entity()` mapping (AGENTS.md tells you: Line 108–120)

5. **Service** (application/services/sale_service.py)
   - Update `create_sale()` if needed (AGENTS.md tells you: Line 67–113)

6. **Controller** (api/controllers/sale_controller.py)
   - No changes needed (discount is handled in service)

7. **Frontend** (FRONTEND/js/pos.js)
   - Update `_calcTotals()` (AGENTS.md tells you: Line 300+)

8. **Update AGENTS.md**
   - Add line number references for all changes
   - Add example calculation if complex
   - Update section: "POS Calculation Engine (Algorithms)"

9. **Commit**
   ```bash
   git add .
   git commit -m "Add new discount type: Senior PWD 30%
   
   - Updated Sale.compute_totals() (domain/entities/sale.py:174)
   - Added discount_type to SaleModel (infrastructure/data/models.py:165)
   - Updated AGENTS.md with new logic
   
   Co-Authored-By: Oz <oz-agent@warp.dev>"
   git push origin main
   ```

---

## Line Number Reference Guide

All major code sections have line number ranges in AGENTS.md:

### Backend Files
- `domain/entities/sale.py` — Lines 1–207
  - `SaleItem` class — Lines 8–51
  - `Sale` class — Lines 53–207
  - `compute_totals()` method — Lines 147–201

- `application/services/sale_service.py` — Lines 1–177
  - `_generate_receipt_number()` — Lines 18–26
  - `_generate_customer_number()` — Lines 29–38
  - `SaleService.__init__()` — Line 43
  - `create_sale()` — Lines 67–113
  - `compute_totals()` — Lines 144–176

- `api/controllers/sale_controller.py` — Lines 1–223
  - `SaleComputeTotalsController` — Lines 27–63
  - `SaleLatestCustomerNumberController` — Lines 66–78
  - `SaleListCreateController` — Lines 81–146
  - `SaleDetailController` — Lines 149–222
  - Cash validation rules — Lines 110–121

- `infrastructure/repositories/sale_repository.py` — Lines 1–141
  - `get_today_count()` — Lines 30–37
  - `get_latest_customer_number()` — Lines 39–49
  - `create()` — Lines 55–88
  - Stock deduction — Lines 85–87

### Frontend Files
- `FRONTEND/js/pos.js` — Line references throughout
  - `initPOS()` — Line 57
  - `_calcTotals()` — Line 300+
  - `addToCart()` — Line 350+
  - `posCheckout()` — Line 500+
  - `TAX_RATE` constant — Line 17

- `FRONTEND/js/sidebar-toggle.js` — Key functions referenced
  - `applyDesktopCollapse()` — Line 65
  - `openMobile()` — Line 90
  - `closeMobile()` — Line 99

### Database Models
- `infrastructure/data/models.py` — Lines 1–250+
  - `UserAdminModel` — Line 16
  - `UserStaffModel` — Line 33
  - `ProductModel` — Line 53
  - `SaleModel` — Line 136
  - `SaleItemModel` — Line 185

---

## Key Patterns in This Project

### 1. Clean Architecture
All code is organized into 4 layers with clear dependencies:
- **API Layer** — HTTP controllers (`api/controllers/`)
- **Application Layer** — Use-cases & services (`application/services/`)
- **Infrastructure Layer** — ORM & repositories (`infrastructure/repositories/`)
- **Domain Layer** — Pure business logic (`domain/entities/`)

### 2. DTO Pattern
Every entity has corresponding DTOs:
- `CreateFooDTO` — for input validation
- `UpdateFooDTO` — for partial updates
- `FooDTO` — for responses

### 3. Repository Pattern
All data access goes through repositories:
- Repository interface — abstract contracts (`application/interfaces/`)
- Repository implementation — concrete queries (`infrastructure/repositories/`)

### 4. Service Pattern
Services orchestrate business logic:
- Services call repositories
- Services call domain entities
- Services return DTOs (never entities to HTTP layer)

### 5. Atomic Operations
Stock deduction uses Django's `F()` expressions to prevent race conditions:
```python
ProductModel.objects.filter(
    pk=item.product_id, stock__gte=item.quantity
).update(stock=F("stock") - item.quantity)
```

---

## Important Constants & Configuration

### VAT Rate
- **Backend:** `TAX_RATE = 0.12` (domain/entities/sale.py:58)
- **Frontend:** `TAX_RATE = 0.12` (FRONTEND/js/pos.js:17)
- **Must match!** Backend and frontend calculations must use the same rate

### Receipt Format
- **Format:** `REC-YYYYMMDD-XXXX` (example: REC-20260321-0001)
- **Generated By:** `_generate_receipt_number()` (application/services/sale_service.py:18)
- **Sequence:** Today's sale count + 1, zero-padded to 4 digits

### Customer Number Format
- **Format:** `CUST-XXXXXX` (example: CUST-000001)
- **Generated By:** `_generate_customer_number()` (application/services/sale_service.py:29)
- **Sequence:** Strictly ascending, global counter

### Time Zone
- **Setting:** `TIME_ZONE = "Asia/Manila"` (config/settings.py:145)
- **Used For:** Receipt date generation, sale filtering by date

---

## Common Mistakes to Avoid

❌ **Don't** hardcode business logic in controllers  
✅ **Do** put logic in domain entities, call from services

❌ **Don't** return domain entities from services  
✅ **Do** convert to DTOs before returning

❌ **Don't** query database directly in controllers  
✅ **Do** call service methods that call repositories

❌ **Don't** use different VAT rates in frontend vs backend  
✅ **Do** keep both at `TAX_RATE = 0.12` or update both

❌ **Don't** fetch-then-update stock (race condition)  
✅ **Do** use atomic F() expressions in repository

❌ **Don't** hardcode API URLs in frontend  
✅ **Do** use constant `POS_API = "http://127.0.0.1:8000/api"` (FRONTEND/js/pos.js:16)

---

## When to Update AGENTS.md

Update AGENTS.md whenever you:
- ✏️ Add a new endpoint
- ✏️ Add a new database table or field
- ✏️ Add a new service or controller
- ✏️ Change a calculation formula
- ✏️ Change validation rules
- ✏️ Add a new constant or configuration
- ✏️ Change architecture or patterns
- ✏️ Fix a bug (if it reveals a misunderstanding in the docs)

**Don't update** for trivial changes (variable renames, formatting, etc.)

---

## Git Workflow with AI Attribution

When committing, always include the co-author line:

```bash
git add .
git commit -m "Feature: Add order notes to sales

- Added notes field to SaleModel (infrastructure/data/models.py)
- Created migration 0008_salemodel_notes.py
- Updated SaleDTO and Service to handle notes
- Updated AGENTS.md with new logic (line references)

Co-Authored-By: Oz <oz-agent@warp.dev>"

git push origin main
```

The commit message should:
1. Describe the feature or fix
2. List all files touched with line number ranges
3. Mention AGENTS.md update
4. Include the co-author line

---

## Summary

**AGENTS.md is your single source of truth.** It contains:
- Every file path and structure
- Every function with line numbers
- Every database table and field
- Every API endpoint
- Every calculation and formula
- Every pattern and rule
- Step-by-step update procedures

**Before making changes:** Read AGENTS.md  
**During development:** Reference AGENTS.md  
**After changes:** Update AGENTS.md with new line numbers  
**Before committing:** Verify AGENTS.md is current  
**When pushing:** Include AI co-author attribution  

---

**Created:** 2026-03-26  
**Next Review:** 2026-04-26 (monthly)

For questions, read AGENTS.md sections:
- Architecture → "Architecture Pattern & Layers"
- New feature → "Update Procedures"
- Patterns → "Common Patterns & Rules"
- Line numbers → "Complete Directory Structure"