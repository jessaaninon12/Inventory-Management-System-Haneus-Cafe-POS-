# Haneus Cafe POS — Inventory Management System

> Point of Sale + Inventory Management for Haneus Cafe.
> Supports **Admin** and **Staff** roles with Clean Architecture backend (Django) and a Vanilla JS frontend.

---

## Project Structure

```
Inventory-Management-System-Haneus-Cafe-POS-/
├── README.md
├── AGENTS.md                          # AI agent knowledge base (git-ignored)
├── index.html                         # Root redirect page
├── .env.example                       # Environment variable template
├── .gitignore
├── metadata.json
├── FRONTEND/
│   ├── dashboard.html                 # Dashboard + embedded POS toggle
│   ├── login.html                     # Login page
│   ├── register.html                  # Registration page
│   ├── products.html                  # Product catalog management
│   ├── managestock.html               # Stock adjustment and tracking
│   ├── lowstock.html                  # Dedicated low-stock view
│   ├── sales.html                     # Sales records and analytics
│   ├── supplier.html                  # Supplier management
│   ├── usermanagement.html            # Admin user management
│   ├── profile.html                   # User profile and settings
│   ├── createproduct.html             # Standalone product creation
│   ├── user.html                      # User detail view
│   ├── css/
│   │   ├── sidebar.css                # SHARED — all-page sidebar layout
│   │   ├── dashboard.css              # Dashboard + POS layout
│   │   ├── payment-modals.css         # Cash / GCash payment modal
│   │   ├── products.css               # Product card grid
│   │   ├── managestock.css            # Stock management table
│   │   ├── sales.css                  # Sales table and summary cards
│   │   ├── supplier.css               # Supplier card grid
│   │   ├── usermanagement.css         # User management table
│   │   ├── profile.css                # Profile card
│   │   ├── login.css                  # Login form
│   │   ├── register.css               # Registration form
│   │   ├── lowstock.css               # Low stock page
│   │   └── user.css
│   ├── js/
│   │   ├── sidebar-toggle.js          # SHARED — desktop collapse + mobile overlay
│   │   ├── role-control.js            # SHARED — role-based sidebar visibility
│   │   ├── logout-modal.js            # SHARED — logout confirmation
│   │   ├── pos.js                     # POS engine: cart, VAT, receipt
│   │   ├── dashboard.js               # Dashboard data + charts
│   │   ├── products.js                # Product CRUD
│   │   ├── managestock.js             # Stock adjustment UI
│   │   ├── sales.js                   # Sales table + analytics
│   │   ├── supplier.js                # Supplier CRUD
│   │   ├── usermanagement.js          # User CRUD
│   │   ├── profile.js                 # Profile form + password change
│   │   ├── login.js                   # Login POST + localStorage
│   │   ├── register.js                # Registration POST
│   │   └── lowstock.js
│   └── images/
└── BACKEND/
    ├── manage.py                      # Django management entrypoint
    ├── requirements.txt               # Python dependencies
    ├── setup_db.py                    # Interactive DB setup wizard
    ├── .env                           # Generated; never committed
    ├── .env.example
    ├── config/
    │   ├── settings.py                # All Django settings (DB, CORS, REST, Spectacular)
    │   ├── urls.py                    # Root URL config (mounts /api/)
    │   ├── asgi.py
    │   └── wsgi.py
    ├── domain/                        # Pure business logic, zero framework deps
    │   └── entities/
    │       ├── sale.py                # Sale + SaleItem; compute_totals(); validate()
    │       ├── product.py             # Product entity
    │       ├── order.py               # Order entity
    │       ├── inventory.py           # InventoryItem + InventoryTransaction entities
    │       └── user.py                # User entity
    ├── application/                   # Use-cases, DTOs, repository interfaces
    │   ├── dtos/
    │   │   ├── sale_dto.py            # CreateSaleDTO, UpdateSaleDTO, SaleDTO
    │   │   ├── dashboard_dto.py       # DashboardDTO
    │   │   ├── product_dto.py         # CreateProductDTO, UpdateProductDTO, ProductDTO
    │   │   ├── order_dto.py           # CreateOrderDTO, OrderDTO
    │   │   ├── inventory_dto.py       # CreateTransactionDTO, InventoryItemDTO
    │   │   └── user_dto.py            # CreateUserDTO, LoginDTO, UserDTO
    │   ├── interfaces/                # Abstract repository contracts
    │   │   ├── sale_repository_interface.py
    │   │   ├── dashboard_repository_interface.py
    │   │   ├── product_repository_interface.py
    │   │   ├── order_repository_interface.py
    │   │   ├── inventory_repository_interface.py
    │   │   └── user_repository_interface.py
    │   └── services/
    │       ├── sale_service.py        # create_sale, compute_totals, receipt/customer number gen
    │       ├── dashboard_service.py   # get_dashboard, get_chart_data, pct_change
    │       ├── product_service.py     # CRUD + low_stock_products
    │       ├── order_service.py       # create_order, cancel, complete
    │       ├── inventory_service.py   # adjust_stock, get_product_history
    │       └── user_service.py        # register, login, update_profile, change_password
    ├── infrastructure/                # ORM models, repositories, migrations
    │   ├── data/
    │   │   ├── models.py              # All ORM models: Product, Order, Sale, User roles, Inventory
    │   │   ├── db_context.py
    │   │   └── db_init.py             # Auto-creates DB on first run
    │   ├── repositories/
    │   │   ├── sale_repository.py     # SaleModel CRUD + get_today_count + get_latest_customer_number
    │   │   ├── dashboard_repository.py# Combines OrderModel + SaleModel for all metrics
    │   │   ├── product_repository.py  # ProductModel CRUD + low_stock
    │   │   ├── order_repository.py    # OrderModel CRUD
    │   │   ├── inventory_repository.py# InventoryTransactionModel + stock adjustment
    │   │   └── user_repository.py     # User CRUD with Django’s AbstractUser
    │   └── migrations/               # 7 sequential migrations
    └── api/                           # HTTP layer only
        ├── models.py                  # auth app: User (AbstractUser) + Product + Sale (legacy)
        ├── views.py                   # Legacy CRUD views (ProductListCreateView, etc.)
        ├── urls.py                    # Legacy URL patterns under /api/products/ /api/sales/
        ├── views_docs.py              # ScalarView for OpenAPI UI
        ├── schema_serializers.py      # drf-spectacular OpenAPI schema definitions
        ├── product_serializers.py     # ProductSerializer, SaleSerializer (DRF)
        ├── user_serializers.py        # UserSerializer
        ├── migrations/               # Auth migrations (User model)
        └── controllers/
            ├── urls.py                # Clean Architecture URL routing
            ├── dashboard_controller.py
            ├── product_controller.py  # v1 + v2 product endpoints
            ├── sale_controller.py     # POS checkout + history endpoints
            ├── sales_analytics_controller.py
            ├── order_controller.py
            ├── inventory_controller.py
            └── user_controller.py     # Auth, Profile, Admin/Staff user management
```

---

## Tech Stack

- **Backend:** Python 3.9, Django 4.2, Django REST Framework 3.16, drf-spectacular 0.29
- **Architecture:** Clean Architecture — Domain / Application / Infrastructure / API
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Database:** MySQL via XAMPP **or** SQL Server (SSMS 19) via ODBC
- **API Docs:** OpenAPI 3.0 (drf-spectacular) + Scalar UI
- **Icons:** Lucide (CDN)
- **Fonts:** Google Fonts – Inter

---

## Startup & Database Setup

### 1. Prerequisites

- Python 3.9+
- MySQL running via XAMPP **or** SQL Server via SSMS 19
- pip

### 2. Enter backend and create virtual environment

```bash
cd BACKEND
python -m venv venv
venv\Scripts\activate        # Windows PowerShell
# source venv/bin/activate   # macOS/Linux
```

### 3. Install dependencies

```bash
pip install -r requirements.txt

# MySQL (XAMPP):
pip install mysqlclient

# SQL Server:
pip install mssql-django pyodbc
```

### 4. Configure the database (interactive wizard)

```bash
python setup_db.py
```

Choose **A** for MySQL / **B** for SQL Server. The script writes `.env` and creates the database automatically.

### 5. Run migrations

```bash
python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate
```

EF-style aliases:

```bash
python manage.py add_migration     # alias for makemigrations
python manage.py update_database   # alias for migrate
```

### 6. Start the server

```bash
python manage.py runserver
```

---

## Available Ports & URLs

| URL | Description |
|---|---|
| `http://127.0.0.1:8000` | Django development server |
| `http://localhost:8000` | Same as above (local alias) |
| `http://localhost:8000/api/scaler/v1` | **Scalar API Docs v1** (canonical) |
| `http://localhost:8000/api/docs/` | Scalar API Docs (legacy alias) |
| `http://localhost:8000/api/schema/` | Raw OpenAPI 3.0 JSON schema |
| `http://localhost:8000/api/redoc/` | ReDoc API documentation |
| `http://localhost:8000/admin/` | Django admin panel |
| `http://localhost:8000/api/` | API root (all endpoints listed in section below) |
| FRONTEND (open directly) | Open `FRONTEND/login.html` in browser or serve via VS Code Live Server |

**Database default ports:**
- MySQL (XAMPP): `3306`
- SQL Server: `1433`

---

## Full API Endpoint Reference

### Auth
| Method | URL | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Authenticate, return UserDTO |
| GET | `/api/auth/check-username/?username=` | Username availability check |

### Profile
| Method | URL | Description |
|---|---|---|
| GET | `/api/profile/<pk>/` | Get user profile |
| PUT | `/api/profile/<pk>/` | Update profile fields |
| PUT | `/api/profile/<pk>/password/` | Change password |

### Dashboard
| Method | URL | Description |
|---|---|---|
| GET | `/api/dashboard/` | Full dashboard aggregate |
| GET | `/api/dashboard/chart/?period=1Y` | Chart data (1D/1W/1M/3M/6M/1Y) |

### Products
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/products/` | List / create |
| GET/PUT/DELETE | `/api/products/<pk>/` | Retrieve / update / delete |
| GET | `/api/products/low-stock/` | Products at or below threshold |
| GET | `/api/products/view/` | v2 list |
| GET | `/api/products/view/<pk>/` | v2 retrieve |
| POST | `/api/products/create/` | v2 create |
| PUT | `/api/products/edit/<pk>/` | v2 full update |
| PATCH | `/api/products/partialedit/<pk>/` | v2 partial update |
| DELETE | `/api/products/delete/<pk>/` | v2 delete |

### POS Sales
| Method | URL | Description |
|---|---|---|
| POST | `/api/sales/create/` | Create sale + receipt + deduct stock |
| GET | `/api/sales/view/` | List all sales |
| GET | `/api/sales/view/<pk>/` | Single sale with items |
| PUT | `/api/sales/edit/<pk>/` | Full update |
| PATCH | `/api/sales/partialedit/<pk>/` | Partial update (status change) |
| DELETE | `/api/sales/delete/<pk>/` | Delete (HTTP 204) |
| POST | `/api/sales/compute-totals/` | Compute VAT+totals without saving |
| GET | `/api/sales/latest-customer-number/` | Next customer number preview |
| GET | `/api/sales/analytics/` | Summary cards (today, week, pending, avg) |

### Orders (Legacy)
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/orders/` | List / create orders |
| GET/PUT/DELETE | `/api/orders/<pk>/` | Order detail |
| POST | `/api/orders/<pk>/cancel/` | Cancel order |
| POST | `/api/orders/<pk>/complete/` | Mark complete |

### Inventory
| Method | URL | Description |
|---|---|---|
| GET | `/api/inventory/` | Full inventory summary |
| GET | `/api/inventory/low-stock/` | Low-stock items |
| POST | `/api/inventory/adjust/` | Record stock adjustment |
| GET | `/api/inventory/<product_id>/history/` | Transaction history |

### Users – Admin
| Method | URL | Description |
|---|---|---|
| GET | `/api/users/admin/view/` | List admins |
| GET | `/api/users/admin/view/<pk>/` | Admin detail |
| POST | `/api/users/admin/create/` | Create admin |
| PUT | `/api/users/admin/edit/<pk>/` | Full update |
| PATCH | `/api/users/admin/partialedit/<pk>/` | Partial update |
| DELETE | `/api/users/admin/delete/<pk>/` | Delete admin |

### Users – Staff
| Method | URL | Description |
|---|---|---|
| GET | `/api/users/staff/view/` | List staff |
| GET | `/api/users/staff/view/<pk>/` | Staff detail |
| POST | `/api/users/staff/create/` | Create staff |
| PUT | `/api/users/staff/edit/<pk>/` | Full update |
| PATCH | `/api/users/staff/partialedit/<pk>/` | Partial update |
| DELETE | `/api/users/staff/delete/<pk>/` | Delete staff |

### Uploads
| Method | URL | Description |
|---|---|---|
| POST | `/api/upload/` | Upload image; returns served URL |

---

## Backend Logic, Formulas & Line Numbers

### POS Calculation Engine

| Formula | File | Line |
|---|---|---|
| `subtotal = Σ(qty × unit_price)` | `domain/entities/sale.py` | `compute_totals()` |
| `discount = subtotal × discount_rate` | `domain/entities/sale.py` | `compute_totals()` |
| `taxable = subtotal − discount` | `domain/entities/sale.py` | `compute_totals()` |
| `vat = taxable × 0.12` (exclusive 12%) | `domain/entities/sale.py` | `compute_totals()` |
| `total = taxable + vat` | `domain/entities/sale.py` | `compute_totals()` |
| `change = cash_tendered − total` | `domain/entities/sale.py` | `compute_totals()` |
| `cogs = Σ(qty × cost_price)` | `domain/entities/sale.py` | `compute_totals()` |
| `gross_profit = subtotal − cogs` | `domain/entities/sale.py` | `compute_totals()` |

Also exposed via API at `POST /api/sales/compute-totals/` — `application/services/sale_service.py` line 144.

### Receipt & Customer Number Generation

| Logic | File | Line |
|---|---|---|
| `receipt_number = REC-YYYYMMDD-XXXX` | `application/services/sale_service.py` | 18–26 |
| `customer_number = CUST-XXXXXX` (ascending) | `application/services/sale_service.py` | 29–38 |
| `today_count` from `SaleRepository.get_today_count()` | `infrastructure/repositories/sale_repository.py` | — |
| `latest_customer` from `SaleRepository.get_latest_customer_number()` | `infrastructure/repositories/sale_repository.py` | — |

### Dashboard Aggregation Logic

| Metric | Logic | File | Line |
|---|---|---|---|
| `profit` | `total_sales − total_expenses` | `application/services/dashboard_service.py` | 32 |
| `profit_change_pct` | `(current − previous) / abs(previous) × 100` | `application/services/dashboard_service.py` | 14–18 |
| `this_week_profit` | `this_week_sales − this_week_expenses` | `application/services/dashboard_service.py` | 54 |
| week-over-week % | calls `_pct_change()` | `application/services/dashboard_service.py` | 69–71 |

### Sales Analytics Controller

| Metric | Logic | File | Line |
|---|---|---|---|
| Today’s sales | `legacy_orders_today + pos_sales_today` | `api/controllers/sales_analytics_controller.py` | 31–50 |
| This week’s sales | Mon–Sun window, both sources | `api/controllers/sales_analytics_controller.py` | 52–81 |
| Pending orders | legacy + POS count | `api/controllers/sales_analytics_controller.py` | 83–88 |
| Average order | weighted average across both | `api/controllers/sales_analytics_controller.py` | 90–124 |

### Stock Status Logic

| Condition | Status | File | Line |
|---|---|---|---|
| `stock ≤ 0` | Out of Stock | `api/models.py` | 60 |
| `0 < stock ≤ low_stock_threshold` | Low Stock | `api/models.py` | 62 |
| `stock > low_stock_threshold` | In Stock | `api/models.py` | 63 |

### Cash Payment Validation

| Rule | File | Line |
|---|---|---|
| `amount_tendered ≤ 0` → 400 error | `api/controllers/sale_controller.py` | 111–116 |
| `amount_tendered < total` → 400 error | `api/controllers/sale_controller.py` | 117–121 |

---

## Frontend Logic, Formulas & Line Numbers

### POS Engine (`FRONTEND/js/pos.js`)

| Function | Purpose |
|---|---|
| `_calcTotals()` | Recalculates subtotal, discount, VAT, total, change in real time |
| `addToCart(product)` | Adds product to cart array; updates UI |
| `updateCartUI()` | Renders the receipt panel item list |
| `placeOrder()` | Calls `POST /api/sales/create/`; shows receipt modal on success |
| `openOrderHistory()` | Fetches `GET /api/sales/view/`; renders rows in history panel |
| `downloadReceiptPNG()` | Calls `html2canvas` to capture receipt DOM and download as PNG |
| `switchView(mode)` | Toggles between Dashboard and POS sections |

Formulas (mirrors backend):

```
subtotal       = Σ (item.price × item.qty)
discountAmount = subtotal × discountRate          (0 or 0.20 for PWD/Senior)
taxable        = subtotal − discountAmount
vat            = taxable × 0.12
total          = taxable + vat
change         = cash_tendered − total
```

### Sidebar Toggle (`FRONTEND/js/sidebar-toggle.js`)

| Function | Purpose | Line |
|---|---|---|
| `applyDesktopCollapse(collapsed)` | Add/remove `.sidebar-collapsed` + `.main-wrapper--collapsed`; saves to localStorage | 65–75 |
| `updateCloseBtnIcon()` | Sets `panel-left-open` (collapsed) or `panel-left-close` (expanded) | 44–51 |
| `updateToggleBtnIcon(isOpen)` | Sets `panel-left-close` or `panel-left` on mobile toggle | 54–61 |
| `openMobile()` / `closeMobile()` | Adds/removes `.sidebar-open` + `.active` on overlay | 90–99 |
| Restore on load | Reads `localStorage['haneuscafe_sidebar_collapsed']`; applies immediately (no animation flash) | 78–86 |
| Resize handler | Cleans mobile state on ≥768px; restores desktop collapse from storage | 141–155 |

### Role Control (`FRONTEND/js/role-control.js`)

| Logic | File | Line |
|---|---|---|
| Reads `user.user_type` from `localStorage` | `role-control.js` | 20–26 |
| Hides/shows elements with `data-role="admin"` | `role-control.js` | 33–36 |
| Normalise: `"Admin"` → `"admin"`, `"Staff"` → `"staff"` | `role-control.js` | 30 |

### Dashboard (`FRONTEND/js/dashboard.js`)

| Feature | API call |
|---|---|
| Summary cards (sales, returns, products, profit) | `GET /api/dashboard/` |
| Bar chart | `GET /api/dashboard/chart/?period=1Y` |
| Low-stock list | `GET /api/products/low-stock/` |
| Notification bell | `GET /api/products/low-stock/` (badge count) |
| Recent sales | `GET /api/dashboard/` (recent_sales field) |

---

## Frontend Logic in CSS — sidebar.css

| Rule | File | Line |
|---|---|---|
| `.sidebar-collapsed` — 64px icon rail | `css/sidebar.css` | `@media (min-width: 768px)` block |
| `.main-wrapper--collapsed` — `margin-left: 64px` | `css/sidebar.css` | `@media (min-width: 768px)` block |
| Mobile: `.sidebar-open` — `translateX(0)` | `css/sidebar.css` | `@media (max-width: 767px)` block |
| `font-size: 0` hides text, keeps SVG icons | `css/sidebar.css` | `.sidebar-collapsed .sidebar-link` |
| Desktop collapse persisted in localStorage key `haneuscafe_sidebar_collapsed` | `js/sidebar-toggle.js` | 29 |

---

## Database Tables

| Table | ORM Model | Description |
|---|---|---|
| `users` | `api.models.User` (AbstractUser) | All users (Admin + Staff) |
| `useradmin` | `infrastructure.data.models.UserAdminModel` | Admin role mapping |
| `userstaff` | `infrastructure.data.models.UserStaffModel` | Staff role mapping |
| `products` | `infrastructure.data.models.ProductModel` | Product catalog |
| `orders` | `infrastructure.data.models.OrderModel` | Legacy order records |
| `order_items` | `infrastructure.data.models.OrderItemModel` | Line items per order |
| `sales` | `infrastructure.data.models.SaleModel` | POS transactions |
| `sale_items` | `infrastructure.data.models.SaleItemModel` | Line items per POS sale |
| `inventory_transactions` | `infrastructure.data.models.InventoryTransactionModel` | Stock adjustment log |

---

## POS Formulas — Full Reference

```
Subtotal       = Σ (quantity × unit_price)
Discount       = Subtotal × discount_rate
Taxable        = Subtotal − Discount
VAT (12%)      = Taxable × 0.12          [exclusive VAT — added on top]
Total          = Taxable + VAT
Change         = amountTendered − Total   [cash payments only]

COGS           = Σ (quantity × cost_price)
Gross Profit   = Subtotal − COGS
Net Sales      = Total Sales − Sales Returns
Avg Order      = (legacy_avg × legacy_count + pos_sum) ÷ combined_count
Avg Daily Sales= Total Sales ÷ Days in Period

Stock Status:
  stock ≤ 0                         → Out of Stock
  0 < stock ≤ low_stock_threshold   → Low Stock
  stock > low_stock_threshold       → In Stock

Receipt #:     REC-YYYYMMDD-XXXX   (today_count + 1, zero-padded 4 digits)
Customer #:    CUST-XXXXXX         (latest_num + 1, zero-padded 6 digits)
```

---

## System Flow

### Login Flow
1. User submits `login.html` form
2. `login.js` POSTs `{ username, password }` to `POST /api/auth/login/`
3. Backend `LoginController` → `UserService.login()` → `UserRepository`
4. Response: `{ success: true, user: UserDTO }` with `user_type: "Admin" | "Staff"`
5. `login.js` saves `user` to `localStorage`; redirects to `dashboard.html`

### POS Checkout Flow
1. User clicks **Point of Sale** toggle in dashboard header
2. `pos.js` fetches `GET /api/products/` to build product grid
3. User adds items; `_calcTotals()` updates receipt panel live
4. User selects payment method, enters tendered amount
5. Click **Place Order** → `POST /api/sales/create/` with cart payload
6. Backend: `SaleListCreateController` → `SaleService.create_sale()` → generates `receipt_number`, `customer_number`, deducts stock, persists
7. Frontend receives response → `receiptModal` shown with all receipt fields
8. User clicks **Download Receipt** → `html2canvas` captures modal; saves PNG
9. Cart resets; product grid refreshes

### Sidebar Toggle Flow

**Desktop:**
- Page loads → `sidebar-toggle.js` reads `localStorage['haneuscafe_sidebar_collapsed']`
- If `'1'`: immediately adds `.sidebar-collapsed` to `#main-sidebar` + `.main-wrapper--collapsed` to wrapper
- `sidebar-close-btn` click → `applyDesktopCollapse(!current)` → animates width 250px↔4px or back

**Mobile:**
- `sidebar-toggle-btn` (visible only on `<768px`) click → `openMobile()` adds `.sidebar-open`
- `sidebar-close-btn` click or overlay click → `closeMobile()` removes `.sidebar-open`

### Role-Based Access Flow
1. `role-control.js` runs on every `DOMContentLoaded`
2. Reads `localStorage.user.user_type` (`"Admin"` or `"Staff"`)
3. `document.querySelectorAll('[data-role]')` → each element shown/hidden based on role
4. `data-role="all"` = always visible; `data-role="admin"` = Admin only

---

## User Roles

**Admin** — Full access: dashboard, products, stock, suppliers, sales analytics, user management, profile.

**Staff** — Limited: dashboard (view only), manage stock, profile. Cannot access: products, sales, user management, suppliers.

Role is enforced:
- **Frontend:** `role-control.js` hides `data-role="admin"` elements for Staff
- **Backend:** controller-level type checks on `/api/users/admin/*` and `/api/users/staff/*` endpoints

---

## Username Uniqueness Check

Registration form: on blur, calls `GET /api/auth/check-username/?username=<value>`.
Response: `{ "available": true }` or `{ "available": false, "error": "Username already used" }`.
Also enforced at the DB level (`username` is `UNIQUE` via Django’s AbstractUser).

---

## Sidebar — Shared Component

All pages include:
1. `css/sidebar.css` (shared layout)
2. `<aside id="main-sidebar">` with identical HTML structure
3. `<div id="sidebar-overlay">` for mobile backdrop
4. `<button id="sidebar-toggle-btn">` in each page’s header
5. `js/sidebar-toggle.js` (shared toggle script) — loaded last before `</body>`

Expanded width: **250px**. Collapsed width: **64px** (icon-only rail).
Collapse state persisted in `localStorage` key `haneuscafe_sidebar_collapsed`.

---

## Recent Updates

- **Sidebar Toggler (Desktop):** Added `.sidebar-collapsed` mode (64px icon-only rail).
  Clicking the `sidebar-close-btn` inside the sidebar collapses/expands. State persists across pages via `localStorage`.
- **Sidebar Toggler (Mobile):** `sidebar-toggle-btn` in header slides sidebar in as overlay; close button + backdrop click dismisses it.
- **Profile Page:** Normalized sidebar class names to match all other pages (`sidebar-nav-section`, `sidebar-section-title`, `sidebar-link`, `sidebar-title`).
- **Anti-shift Fix:** `margin-left` on `.main-wrapper` transitions smoothly (0.28s). Mobile override (`margin-left: 0`) prevents shift.
- **Role-based Visibility:** Unchanged — `data-role` attributes work across all pages regardless of sidebar state.

---

## Project Structure

```
Inventory-Management-System-Haneus-Cafe-POS-/
│
├── README.md
├── index.html                          # Root landing / redirect page
├── .env.example                        # Environment variable template
├── .gitignore
│
├── FRONTEND/                           # All HTML, CSS, and JavaScript
│   ├── dashboard.html                  # Main admin page — Dashboard + POS toggle
│   ├── login.html
│   ├── register.html
│   ├── products.html
│   ├── managestock.html
│   ├── lowstock.html
│   ├── sales.html
│   ├── supplier.html
│   ├── usermanagement.html
│   └── profile.html
│   │
│   ├── css/
│   │   ├── dashboard.css               # Dashboard + POS layout + Receipt modal + Order history
│   │   ├── login.css
│   │   ├── register.css
│   │   ├── products.css
│   │   ├── managestock.css
│   │   ├── lowstock.css
│   │   ├── sales.css
│   │   ├── supplier.css
│   │   ├── usermanagement.css
│   │   └── profile.css
│   │
│   ├── js/
│   │   ├── pos.js                      # POS engine: cart, VAT calc, receipt modal, order history
│   │   ├── dashboard.js                # Dashboard data fetching, charts, summary cards
│   │   ├── sidebar-toggle.js           # Shared responsive sidebar (all pages)
│   │   ├── logout-modal.js             # Logout confirmation
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── products.js
│   │   ├── managestock.js
│   │   ├── lowstock.js
│   │   ├── sales.js
│   │   ├── supplier.js
│   │   ├── usermanagement.js
│   │   └── profile.js
│   │
│   └── images/
│       └── coffee.png
│
└── BACKEND/                            # Django project root
    ├── manage.py
    ├── requirements.txt
    ├── setup_db.py                     # Interactive DB setup (MySQL or SQL Server)
    ├── .env                            # Generated by setup_db.py — not committed
    ├── .env.example
    │
    ├── config/                         # Django project configuration
    │   ├── settings.py
    │   ├── urls.py
    │   ├── asgi.py
    │   └── wsgi.py
    │
    ├── domain/                         # Pure business logic — no external dependencies
    │   └── entities/
    │       ├── sale.py                 # Sale + SaleItem entities; compute_totals(); validate()
    │       ├── product.py
    │       ├── order.py
    │       ├── inventory.py
    │       └── user.py
    │
    ├── application/                    # Use-cases, DTOs, repository interfaces
    │   ├── dtos/
    │   │   ├── sale_dto.py             # CreateSaleDTO, UpdateSaleDTO, SaleDTO
    │   │   ├── dashboard_dto.py
    │   │   ├── product_dto.py
    │   │   ├── order_dto.py
    │   │   ├── inventory_dto.py
    │   │   └── user_dto.py
    │   ├── interfaces/
    │   │   ├── sale_repository_interface.py
    │   │   ├── dashboard_repository_interface.py
    │   │   ├── product_repository_interface.py
    │   │   ├── order_repository_interface.py
    │   │   ├── inventory_repository_interface.py
    │   │   └── user_repository_interface.py
    │   └── services/
    │       ├── sale_service.py         # create_sale(), receipt number gen, compute_totals()
    │       ├── dashboard_service.py
    │       ├── product_service.py
    │       ├── order_service.py
    │       ├── inventory_service.py
    │       └── user_service.py
    │
    ├── infrastructure/                 # ORM models, repositories, migrations
    │   ├── data/
    │   │   ├── models.py               # SaleModel, SaleItemModel, ProductModel, OrderModel, etc.
    │   │   ├── db_context.py
    │   │   └── db_init.py              # Auto-creates the database on first run
    │   ├── repositories/
    │   │   ├── sale_repository.py      # CRUD + get_today_count() for receipt sequencing
    │   │   ├── dashboard_repository.py # Combines OrderModel + SaleModel for all metrics
    │   │   ├── product_repository.py
    │   │   ├── order_repository.py
    │   │   ├── inventory_repository.py
    │   │   └── user_repository.py
    │   └── migrations/
    │       ├── 0001_initial.py
    │       ├── 0002_useradminmodel_userstaffmodel.py
    │       ├── 0003_salemodel_saleitemmodel.py
    │       ├── 0004_saleitemmodel_cost_price.py
    │       ├── 0005_alter_saleitemmodel_cost_price.py
    │       ├── 0006_alter_productmodel_image_url.py
    │       └── 0007_salemodel_receipt_fields.py  # Adds receipt_number, customer_number, cashier_name, order_type
    │
    └── api/                            # HTTP layer — thin controllers only
        ├── controllers/
        │   ├── sale_controller.py      # SaleListCreateController, SaleDetailController, SaleComputeTotalsController
        │   ├── dashboard_controller.py
        │   ├── product_controller.py
        │   ├── order_controller.py
        │   ├── inventory_controller.py
        │   ├── sales_analytics_controller.py
        │   └── user_controller.py
        ├── migrations/                 # Auth / User model migrations
        ├── urls.py
        ├── schema_serializers.py       # drf-spectacular OpenAPI schema definitions
        └── views.py
```

---

## POS Calculation Engine

VAT is applied **exclusively** — it is added on top of the discounted subtotal, not included in the price.

```
subtotal       = Σ (item.price × item.quantity)
discountAmount = subtotal × discountRate
taxableAmount  = subtotal − discountAmount
vatAmount      = taxableAmount × 0.12
total          = taxableAmount + vatAmount
change         = amountTendered − total
```

All amounts are rounded to 2 decimal places. This logic is implemented in:

- **Frontend:** `FRONTEND/js/pos.js` → `_calcTotals()`
- **Backend:** `BACKEND/domain/entities/sale.py` → `Sale.compute_totals()`

---

## Receipt Number and Customer Number

**Receipt Number format:** `REC-YYYYMMDD-XXXX`

Sequence is today's sale count + 1, zero-padded to 4 digits.

```
Example: REC-20260321-0001
```

Generated by `_generate_receipt_number(today_count)` in `sale_service.py`.

**Customer Number format:** `CUST-XXXXXX` (strictly ascending 6-digit sequence)

Generated server-side by `_generate_customer_number(latest_num)` in `sale_service.py`. The repository reads the numeric part of the most recently created customer number and increments it by 1. Frontend fetches the next value from `GET /api/sales/latest-customer-number/` before opening the payment modal.

---

## Database Tables

### `sales` (SaleModel)

| Column | Type | Notes |
|---|---|---|
| id | int PK | Auto-increment |
| sale_id | varchar(50) UNIQUE | Client-generated transaction ID |
| receipt_number | varchar(30) UNIQUE | `REC-YYYYMMDD-XXXX` |
| customer_number | varchar(20) | `CUST-XXXXXX` |
| cashier_name | varchar(200) | Logged-in user's name |
| order_type | varchar(20) | Dine In / Take Out |
| customer_name | varchar(200) | Walk-in or provided name |
| table_number | varchar(50) | Optional |
| payment_method | varchar(20) | Cash / Card / GCash / Maya |
| subtotal | decimal(12,2) | Pre-VAT, pre-discount total |
| discount | decimal(12,2) | Discount amount |
| tax | decimal(12,2) | VAT (12% of taxable) |
| total | decimal(12,2) | Final amount due |
| amount_tendered | decimal(12,2) | Cash received from customer |
| change_amount | decimal(12,2) | tendered − total |
| status | varchar(20) | Completed / Pending / Cancelled |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### `sale_items` (SaleItemModel)

| Column | Type | Notes |
|---|---|---|
| id | int PK | Auto-increment |
| sale_id | int FK | → `sales.id` |
| product_id | int FK (nullable) | → `products.id` |
| product_name | varchar(200) | Snapshot at time of sale |
| quantity | int | |
| unit_price | decimal(10,2) | Selling price at time of sale |
| cost_price | decimal(10,2) | Cost at time of sale (for COGS) |
| total | decimal(12,2) | `quantity × unit_price` |

---

## POS API Endpoints

Base URL: `http://localhost:8000/api`

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/sales/create/` | Create sale, generate receipt number, save items |
| `GET` | `/api/sales/view/` | List all sales (order history) |
| `GET` | `/api/sales/view/<id>/` | Get a single sale with its items |
| `PUT` | `/api/sales/edit/<id>/` | Full update (customer_name, payment_method, status) |
| `PATCH` | `/api/sales/partialedit/<id>/` | Partial update |
| `DELETE` | `/api/sales/delete/<id>/` | Delete a sale (HTTP 204) |
| `POST` | `/api/sales/compute-totals/` | Compute totals without saving |

### POST /api/sales/create/ — Example Request

```json
{
  "sale_id": "SALE-20260321-4521",
  "customer_name": "Walk-in",
  "cashier_name": "Admin",
  "order_type": "Dine In",
  "table_number": "B01 - Indoor",
  "payment_method": "GCash",
  "subtotal": "702.00",
  "discount": "0.00",
  "tax": "84.24",
  "total": "786.24",
  "amount_tendered": "786.24",
  "change_amount": "0.00",
  "status": "Completed",
  "items": [
    {
      "product_id": 3,
      "product_name": "Machiato",
      "quantity": 3,
      "unit_price": "234.00"
    }
  ]
}
```

### Response

```json
{
  "id": 1,
  "receipt_number": "REC-20260321-0001",
  "customer_number": "CUST-458291",
  "sale_id": "SALE-20260321-4521",
  "cashier_name": "Admin",
  "order_type": "Dine In",
  "customer_name": "Walk-in",
  "payment_method": "GCash",
  "subtotal": "702.00",
  "discount": "0.00",
  "tax": "84.24",
  "total": "786.24",
  "amount_tendered": "786.24",
  "change_amount": "0.00",
  "status": "Completed",
  "created_at": "2026-03-21T14:45:00Z",
  "items": [
    {
      "id": 1,
      "product_name": "Machiato",
      "quantity": 3,
      "unit_price": "234.00",
      "total": "702.00"
    }
  ]
}
```

---

## Receipt UI

The receipt is a centered modal with a monospace thermal-paper layout:

```
          HANEUS CAFE
   BRGY Balbautog Sitio Uwagan
  ───────────────────────────────
  Receipt #:  REC-20260321-0001
  Customer #: CUST-458291
  Date:       Mar 21, 2026 2:45 PM
  Cashier:    Admin
  Order Type: Dine In
  ───────────────────────────────
  ORDER                     PRICE
  3x Machiato            ₱702.00
  ───────────────────────────────
  Subtotal                ₱702.00
  Discount                  ₱0.00
  VAT (12%)                ₱84.24
  ═══════════════════════════════
  TOTAL                   ₱786.24
  ───────────────────────────────
  Payment:   GCash
  Tendered:  ₱786.24
  Change:    ₱0.00
  ───────────────────────────────
      Thank you for visiting!

  [ Download Receipt ]  [ OK ]
```

**Download/Print:** calls `window.print()`. The `@media print` block in `dashboard.css` hides all page elements except the receipt modal so only the receipt is printed.

---

## Order History

The **Order History** floating panel is opened from the `[ 📋 Order History ]` button in the POS header.

- Fetches `GET /api/sales/view/` on open
- Displays Receipt #, date/time, and total per row
- Clicking a row fetches `GET /api/sales/view/<id>/` and re-opens the full receipt modal with a Download button

---

## Dashboard Integration

Every completed POS sale automatically feeds into the dashboard. `DashboardRepository` queries both `OrderModel` and `SaleModel` so all aggregations include POS data:

| Metric | Logic |
|---|---|
| **Total Sales** | `SUM(sales.total WHERE status='Completed')` + legacy orders |
| **Orders Today** | `COUNT(sales WHERE date=today AND status='Completed')` |
| **Recent Sales** | Latest 5 rows from SaleModel (fallback to OrderModel) |
| **Top Selling** | `GROUP BY product_name ORDER BY SUM(quantity) DESC` across both sources |
| **Low Stock** | Products where `stock ≤ low_stock_threshold` |

---

## Frontend POS Flow

1. Click **Point of Sale** toggle in the dashboard header
2. Product grid loads via `GET /api/products/`
3. Click products to add to cart; adjust quantities with +/− buttons
4. Select discount (None / PWD+Senior 20%), payment method, enter tendered amount
5. Click **Place Order** → calls `POST /api/sales/create/`
6. Backend generates `receipt_number` + `customer_number`, saves sale and items
7. Frontend receives the response and shows the **Receipt Modal**
8. Click **Download Receipt** to print, or **OK** to reset the cart
9. Product grid refreshes automatically to reflect updated stock levels

---

## Responsive Sidebar

All inner pages share `FRONTEND/js/sidebar-toggle.js`:

- **Desktop:** Close button (inside sidebar) collapses to a 60 px icon-rail
- **Mobile (< 768 px):** Burger button slides the sidebar in as a fixed overlay; clicking the backdrop closes it
- **Escape key:** Closes the mobile sidebar

Required element IDs: `main-sidebar`, `sidebar-overlay`, `sidebar-toggle-btn`

---

## Installation

### Prerequisites

- Python 3.9+
- pip
- MySQL via XAMPP **or** SQL Server via SSMS 19

### Setup Steps

```bash
# 1. Enter BACKEND and create a virtual environment
cd BACKEND
python -m venv venv
venv\Scripts\activate

# 2. Install base dependencies
pip install -r requirements.txt

# For MySQL (XAMPP):
pip install mysqlclient

# For SQL Server:
pip install mssql-django pyodbc
```

### Configure the Database

```bash
python setup_db.py
```

Choose **A** for MySQL or **B** for SQL Server. Accept defaults with Enter. The script writes `.env` and creates the database automatically — no manual DB creation in SSMS or phpMyAdmin needed.

### Run Migrations

```bash
python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate
```

### Start the Server

```bash
python manage.py runserver
```

- Server: `http://127.0.0.1:8000`
- API Reference (Scalar): `http://localhost:8000/api/scaler/v1`
- Legacy API Docs: `http://localhost:8000/api/docs/`
- Raw OpenAPI Schema: `http://localhost:8000/api/schema/`

---

## Migration Commands

Standard Django:

```bash
python manage.py makemigrations
python manage.py migrate
```

Entity Framework–style aliases:

```bash
python manage.py add_migration
python manage.py update_database
```

---

## POS Formulas — Full Reference

```
Subtotal       = Σ (quantity × unit_price)
Discount       = Subtotal × discountRate
Taxable        = Subtotal − Discount
VAT (12%)      = Taxable × 0.12
Total          = Taxable + VAT          (= Subtotal − Discount + VAT)
Change Due     = amountTendered − Total  (Cash payments only)

COGS           = Σ (quantity × cost_price)
Gross Profit   = Subtotal − COGS
Net Sales      = Total Sales − Sales Returns
Avg Txn Value  = Total Sales ÷ Transaction Count
Items / Txn    = Total Units Sold ÷ Transaction Count
Avg Daily Sales= Total Sales ÷ Days in Period

Reorder Point  = (Lead Time × Avg Daily Sales) + Safety Stock
Safety Stock   = (Max Daily Sales × Max Lead Time) − (Avg Daily Sales × Avg Lead Time)
Days of Cover  = Current Stock ÷ Avg Daily Sales
EOQ            = √((2 × Annual Demand × Order Cost) ÷ Holding Cost)
```

---

## User Roles

**Admin** — Full access: products, orders, inventory, sales, user management, dashboard analytics, create/delete Admin and Staff accounts.

**Staff** — Limited access: view products, manage stock, view dashboard. Cannot access user management, sales analytics, or admin-only settings.

Role-based access is enforced on the frontend (`FRONTEND/js/role-control.js` reads `user.user_type` from `localStorage` after login — value is `"Admin"` or `"Staff"` as returned by `UserDTO.to_dict()`) and on the backend (controller-level permission checks).

Sidebar items are shown or hidden entirely via `data-role` attributes on `<div class="sidebar-nav-section">` and individual `<a>` elements. Allowed values are `"all"` (everyone), `"admin"` (Admin only), or `"staff"` (Staff only). The same sidebar HTML is reused across all pages — `role-control.js` applies visibility on every `DOMContentLoaded` event.

---

## Username Uniqueness Validation

The registration form checks username availability in real time. On blur, the frontend calls `GET /api/auth/check-username/?username=<value>`. The response is `{ "available": true/false, "message": "..." }`. A green or red hint appears below the input. The uniqueness constraint is also enforced at the database level.

---

## Alert and Stock Status Logic

| Condition | Status |
|---|---|
| `stock > low_stock_threshold` | In Stock |
| `0 < stock ≤ low_stock_threshold` | Low Stock |
| `stock = 0` | Out of Stock |

Dashboard bell notifications are built from `GET /api/products/low-stock/`. Read state is persisted in `localStorage` under the key `haneus_notif_store`.

---

## Sales Page Integration

The Sales page (`FRONTEND/sales.html` + `js/sales.js`) reads live POS data directly from `SaleModel`:

- **Table rows** — fetched from `GET /api/sales/view/` (returns `SaleModel` records with `receipt_number`, `customer_name`, `created_at`, `items`, `total`, `status`).
- **Detail modal** — fetches `GET /api/sales/view/<pk>/` and shows receipt #, customer #, cashier, order type, subtotal/discount/tax/total, tendered, change, and line items.
- **Refund / Cancel** — sends `PATCH /api/sales/partialedit/<pk>/` with `{ status: 'Cancelled' }`.
- **Mark Completed** — sends `PATCH /api/sales/partialedit/<pk>/` with `{ status: 'Completed' }`.
- **Summary cards** — fetched from `GET /api/sales/analytics/`, which now combines `OrderModel` + `SaleModel` for all four metrics (today's sales, this week, pending orders, average order).
- **CSV export** — built from the in-memory `allOrders` array; columns include receipt #, subtotal, discount, tax, total, payment method.

---

## Implementation Notes

- Code-first approach: tables are created from model definitions via Django migrations. No manual SQL needed.
- The database is created automatically when `setup_db.py` runs, and again when `python manage.py migrate` is called.
- SQL Server supports both SQL Server Authentication and Windows Authentication with automatic fallback across multiple server configurations.
- The database name `haneuscafedb` is lowercase for MySQL compatibility. SQL Server uses the same name without issues.
- Image uploads on the Products page use FileReader to convert files to base64 data URIs sent as the `image_url` field — no multipart form upload is used.
- `role-control.js` reads `user.user_type` (not `user.role` or `user.is_admin`) from `localStorage`. This field is set by the backend's `UserDTO.to_dict()` at login and must always equal `"Admin"` or `"Staff"`.
- Stock deduction on POS sale uses an atomic `UPDATE … SET stock = stock - qty WHERE stock >= qty` guard to prevent negative stock without a race condition.
- `SalesAnalyticsController` combines both `OrderModel` (legacy) and `SaleModel` (POS) for every metric so the sales page summary always reflects the full transaction history.
