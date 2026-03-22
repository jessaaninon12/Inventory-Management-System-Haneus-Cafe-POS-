# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Running the Backend

All commands must be run from the `BACKEND/` directory with the virtual environment active.

```powershell
cd BACKEND
venv\Scripts\Activate.ps1        # PowerShell
# or: venv\Scripts\activate.bat  # CMD

# First-time setup only
python setup_db.py                # interactive DB config — writes .env, creates DB
pip install -r requirements.txt   # base deps
pip install mysqlclient            # MySQL (XAMPP)
# or: pip install mssql-django pyodbc  # SQL Server (SSMS)

# Migrations
python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate

# Dev server
python manage.py runserver
```

- Backend: `http://127.0.0.1:8000`
- API docs (Scalar): `http://localhost:8000/api/scaler/v1`
- OpenAPI schema: `http://localhost:8000/api/schema/`

There is no automated test runner configured. All testing is manual via the browser and the API docs UI.

Entity Framework–style migration aliases also work:
```powershell
python manage.py add_migration      # alias for makemigrations
python manage.py update_database    # alias for migrate
```

## Frontend

Open any HTML file directly in a browser — there is no build step. The frontend is plain HTML/CSS/Vanilla JS. All JS files use the base URL `http://127.0.0.1:8000` hardcoded; the backend must be running locally.

## Architecture

### Backend — Clean Architecture (4 layers)

```
domain/entities/       Pure Python dataclasses — no ORM, no Django imports
application/dtos/      Input/output data-transfer objects
application/services/  Use-case orchestration; depends only on interfaces
application/interfaces/Abstract repository contracts (Python ABCs)
infrastructure/data/models.py    Django ORM models (single source of DB truth)
infrastructure/repositories/     Concrete ORM implementations
api/controllers/       Thin HTTP views; parse request → call service → return Response
```

The `api/models.py` file contains a legacy `Product` and `Sale` model that were the original implementation. The authoritative models are in `infrastructure/data/models.py` (`ProductModel`, `SaleModel`, `SaleItemModel`, `OrderModel`, `OrderItemModel`, `UserAdminModel`, `UserStaffModel`). The `api.models.User` (AbstractUser) is the auth model referenced by `settings.AUTH_USER_MODEL`.

### Key data flow — POS checkout

1. Frontend `pos.js` → `POST /api/sales/create/` (via `SaleListCreateController`)
2. Controller validates cash amounts, builds `CreateSaleDTO`, calls `SaleService.create_sale()`
3. Service generates `receipt_number` (REC-YYYYMMDD-XXXX) and `customer_number` (CUST-XXXXXX, strictly ascending) then validates via domain entity
4. `SaleRepository.create()` persists `SaleModel` + `SaleItemModel` rows and atomically decrements `ProductModel.stock` (using `stock__gte=quantity` guard)
5. Response is a `SaleDTO.to_dict()` that includes `receipt_number`, `customer_number`, and line items — used to populate the receipt modal

### Role system

- `api/models.User.user_type` stores `"Admin"` or `"Staff"` (Django CharField with choices)
- On login the backend returns `UserDTO.to_dict()` which includes `user_type`; the frontend stores the full object in `localStorage` as `user`
- `FRONTEND/js/role-control.js` reads `user.user_type` (not `user.role` / `user.is_admin`) and applies `display:none` to sidebar `<div data-role="admin">` elements for Staff accounts
- **Never** read `user.role` or `user.is_admin` — these fields do not exist in the DTO

### Sidebar

Every inner page has an identical sidebar HTML block with `data-role` attributes on `<div class="sidebar-nav-section">` elements and some `<a>` tags. `role-control.js` + `sidebar-toggle.js` are included on every page and handle both visibility and collapse/overlay behaviour. To add or remove a sidebar item: edit the HTML in each page file (they are not templated).

### Sales analytics

`GET /api/sales/analytics/` is served by `SalesAnalyticsController`. It combines both `OrderModel` (legacy orders) and `SaleModel` (POS transactions) for all four summary metrics: today's sales, this-week sales, pending orders count, and weighted average order value.

### Dashboard

`dashboard.js` and `pos.js` both live on `dashboard.html`. `switchView('pos' | 'dashboard')` toggles visibility between the two `<div>` sections. The POS is lazy-initialised on first toggle.

## Important conventions

- The `api/controllers/urls.py` is the active URL config (mounted under `/api/` in `config/urls.py`). The `api/urls.py` file is legacy and only serves a small subset of old endpoints.
- Numeric POS fields (`subtotal`, `discount`, `tax`, `total`, `amount_tendered`, `change_amount`) are stored as `Decimal` in the DB and returned as strings in JSON responses. Frontend parses them with `parseFloat()`.
- The `sale_id` field is client-generated (`SALE-YYYYMMDD-XXXX`) and is distinct from the DB primary key (`id`) and `receipt_number`.
- Stock deduction is intentionally a silent no-op when `stock < quantity` at the DB level; the frontend cart already enforces the stock limit.
- `FRONTEND/js/sales.js` sources data from `GET /api/sales/view/` (SaleModel), not `GET /api/orders/` (OrderModel). The refund and complete actions use `PATCH /api/sales/partialedit/<pk>/`.
