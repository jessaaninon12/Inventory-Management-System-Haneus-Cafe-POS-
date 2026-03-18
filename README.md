# Haneus Cafe POS — Inventory Management System

A full-stack point-of-sale and inventory management system for coffee shops, built with **Django + Clean Architecture** backend and a static HTML/CSS/JS frontend.

---

## Architecture Overview

The backend follows **Clean Architecture** with strict dependency direction:

```
API (Controllers)  →  Infrastructure (Repositories + DB)  →  Application (Services + DTOs)  →  Domain (Entities)
```

- **Domain** — Pure business entities with zero dependencies.
- **Application** — Services, DTOs, and repository interfaces (abstractions).
- **Infrastructure** — Django ORM models, concrete repository implementations.
- **API** — Thin DRF controllers for HTTP request/response handling.

---

## Project Structure

```
Inventory-Management-System-Haneus-Cafe-POS/
│
├── BACKEND/
│   │
│   ├── domain/                          # DOMAIN LAYER (pure business logic)
│   │   └── entities/
│   │       ├── user.py                  # User entity + validation
│   │       ├── product.py               # Product entity + validation
│   │       ├── order.py                 # Order + OrderItem entities
│   │       └── inventory.py             # InventoryTransaction + InventoryItem
│   │
│   ├── application/                     # APPLICATION LAYER (orchestration)
│   │   ├── services/
│   │   │   ├── user_service.py          # User register / login / profile
│   │   │   ├── product_service.py       # Product business operations
│   │   │   ├── order_service.py         # Order lifecycle management
│   │   │   ├── inventory_service.py     # Stock adjustment logic
│   │   │   └── dashboard_service.py     # Dashboard aggregation logic
│   │   ├── dtos/
│   │   │   ├── user_dto.py              # UserDTO, CreateUserDTO, UpdateUserDTO, LoginDTO, ChangePasswordDTO
│   │   │   ├── product_dto.py           # Product DTOs (Create, Update, Read)
│   │   │   ├── order_dto.py             # Order DTOs
│   │   │   ├── inventory_dto.py         # Inventory DTOs
│   │   │   └── dashboard_dto.py         # Dashboard DTO
│   │   └── interfaces/
│   │       ├── user_repository_interface.py
│   │       ├── product_repository_interface.py
│   │       ├── order_repository_interface.py
│   │       ├── inventory_repository_interface.py
│   │       └── dashboard_repository_interface.py
│   │
│   ├── infrastructure/                  # INFRASTRUCTURE LAYER (DB + ORM)
│   │   ├── data/
│   │   │   ├── models.py                # Django ORM models (ProductModel, OrderModel, etc.)
│   │   │   └── db_context.py            # DB utilities (transactions, health check)
│   │   ├── repositories/
│   │   │   ├── user_repository.py       # Concrete UserRepository (auth, profile)
│   │   │   ├── product_repository.py    # Concrete ProductRepository
│   │   │   ├── order_repository.py      # Concrete OrderRepository
│   │   │   ├── inventory_repository.py  # Concrete InventoryRepository
│   │   │   └── dashboard_repository.py  # Dashboard aggregation queries
│   │   ├── migrations/
│   │   ├── apps.py                      # Django app config
│   │   └── models.py                    # Re-export for Django auto-discovery
│   │
│   ├── api/                             # API LAYER (HTTP controllers)
│   │   ├── controllers/
│   │   │   ├── user_controller.py       # Register, Login, Profile, ChangePassword
│   │   │   ├── product_controller.py    # Product CRUD endpoints
│   │   │   ├── order_controller.py      # Order CRUD + cancel/complete
│   │   │   ├── inventory_controller.py  # Inventory summary + stock adjust
│   │   │   ├── dashboard_controller.py  # Dashboard aggregated stats
│   │   │   ├── sales_analytics_controller.py  # Sales analytics endpoint
│   │   │   └── urls.py                  # Clean Architecture API routes
│   │   ├── models.py                    # User, Product, Sale (legacy models)
│   │   ├── user_serializers.py          # DRF serializers: Register, Login, Profile
│   │   ├── product_serializers.py       # DRF serializers: Product, Sale
│   │   ├── schema_serializers.py        # OpenAPI schema-only serializers (drf-spectacular)
│   │   ├── views.py                     # Legacy CRUD views (Product, Sale, ImageUpload)
│   │   └── urls.py                      # Legacy API routes
│   │
│   ├── config/                          # DJANGO PROJECT CONFIG
│   │   ├── settings.py                  # Main settings (DB, apps, CORS)
│   │   ├── urls.py                      # Root URL routing
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── pos_core/                        # Legacy Django config (preserved)
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── python/                          # Utility scripts
│   │   └── db_config.py
│   ├── setup_db.py                      # Interactive DB setup (generates .env)
│   │
│   ├── manage.py                        # Entry point → config.settings
│   ├── requirements.txt
│   └── .env.example
│
├── FRONTEND/                            # Static frontend (HTML/CSS/JS)
│   ├── login.html                       # User login page
│   ├── register.html                    # User registration page
│   ├── dashboard.html                   # Admin dashboard
│   ├── products.html                    # Product list
│   ├── createproduct.html               # Create product form
│   ├── lowstock.html                    # Low stock alerts
│   ├── managestock.html                 # Stock management
│   ├── sales.html                       # Sales & orders
│   ├── profile.html                     # User profile
│   ├── css/                             # Stylesheets
│   │   ├── login.css
│   │   ├── register.css
│   │   ├── dashboard.css
│   │   ├── products.css
│   │   └── ...
│   ├── js/                              # JavaScript
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── dashboard.js
│   │   ├── products.js
│   │   └── ...
│   └── images/
│
├── index.html
├── .gitignore
├── metadata.json
└── README.md
```

---

## Tech Stack

**Frontend:** HTML, CSS, vanilla JavaScript, Lucide Icons (CDN), Google Fonts (Inter)

**Backend:** Python 3.10+, Django 4.2, Django REST Framework, django-cors-headers, python-dotenv, drf-spectacular

**Database:** MySQL via XAMPP (default) **or** SQL Server via SSMS 19

**API Docs:** Scalar v1 (OpenAPI 3.0)

---

## Running the Development Server

```bash
python -m venv venv

After that, activate it with:

.\venv\Scripts\Activate.ps1

python manage.py runserver
```

Expected output:

```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
Django version 4.2.x, using settings 'config.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

### Available URLs

| URL | Description |
|-----|-------------|
| http://localhost:8000/api/docs/ | **Scalar** interactive API reference (recommended) |
| http://localhost:8000/api/redoc/ | ReDoc alternative API view |
| http://localhost:8000/api/schema/ | Raw OpenAPI 3.0 JSON schema |
| http://localhost:8000/admin/ | Django admin panel |

> Open **http://localhost:8000/api/docs/** to browse and test every endpoint directly in the browser — no Postman needed.

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- **Option A:** XAMPP (MySQL/MariaDB)
- **Option B:** SQL Server Management Studio (SSMS) 19

---

### Quick Start (Recommended)

The fastest way to get started — an interactive setup script that creates your `.env` file.

#### 1. Create virtual environment and install dependencies

```bash
cd BACKEND
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
```

#### 2. Run the interactive database setup

```bash
python setup_db.py
```

The script will display:

```
╔══════════════════════════════════════════════════════╗
║       Haneus Cafe POS — Database Setup               ║
╚══════════════════════════════════════════════════════╝

Select your database engine:

  [A] MySQL / MariaDB  (via XAMPP)
  [B] SQL Server       (via SSMS 19)

  Your choice (A/B):
```

**If you choose A (MySQL):**

```
── MySQL / MariaDB (XAMPP) ──────────────────────────
  Database name [Haneus-Inventory]:
  Username [root]:
  Password (leave blank for none) []:
  Host [127.0.0.1]:
  Port [3306]:
```

Press Enter to accept the defaults (shown in brackets), or type your own values.

**If you choose B (SQL Server):**

```
── SQL Server (SSMS 19) ────────────────────────────
  Database name [HaneusCafeDB]:
  Username [sa]: ProjectSuico
  Password: 9999
  Host (e.g. localhost or localhost\SQLEXPRESS) [localhost]:
  Port [1433]:
  ODBC Driver [ODBC Driver 17 for SQL Server]:
```

Fill in your SQL Server login credentials. The script generates the `.env` file automatically.

> **Important:** Before choosing B, you must have SQL Server running with TCP/IP enabled and a SQL login created. See the **"Enable SQL Server Login (Mixed Mode)"** section below if you haven't done this yet.

#### 3. Install the database driver

```bash
pip install mysqlclient           # Option A — MySQL/XAMPP
pip install mssql-django pyodbc   # Option B — SQL Server/SSMS
```

#### 4. Run migrations and start the server

```bash
python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate
python manage.py createsuperuser   # Optional
python manage.py runserver
```

Open **http://localhost:8000/api/docs/** to see the interactive API documentation.

---

### Option A: MySQL via XAMPP (Manual)

#### 1. Start XAMPP
1. Open **XAMPP Control Panel**.
2. Start **Apache** and **MySQL** — both should show green "Running".

#### 2. Create the Database

**Via phpMyAdmin SQL tab (recommended):**
1. Go to `http://localhost/phpmyadmin`.
2. Click **SQL** tab → paste and run:

```sql
CREATE DATABASE `Haneus-Inventory`
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
```

**Or via phpMyAdmin UI:**
1. Click **Databases** tab → type `Haneus-Inventory` → select `utf8mb4_general_ci` → **Create**.

#### 3. Configure .env

Run `python setup_db.py` and choose **A**, or manually copy `BACKEND/.env.example` to `BACKEND/.env`:

```
DB_ENGINE=mysql
DB_NAME=Haneus-Inventory
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
```

> XAMPP default: user `root`, no password.

#### 4. Install & Migrate

```bash
cd BACKEND
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
pip install mysqlclient           # MySQL driver

python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate

# (Optional) Create admin superuser
python manage.py createsuperuser

python manage.py runserver
```

#### 5. Verify in phpMyAdmin

Go to `http://localhost/phpmyadmin` → click `Haneus-Inventory`. You should see tables:
- `users` — registered user accounts
- `products` — product catalog (Clean Architecture)
- `orders` / `order_items` — order records
- `inventory_transactions` — stock movement log
- `api_product` / `api_sale` — legacy tables

---

### Option B: SQL Server via SSMS 19 (Manual)

#### 1. Install Prerequisites

- [SQL Server 2022 Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (free)
- [SSMS 19](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
- [ODBC Driver 17 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)

#### 2. Create the Database in SSMS

1. Open **SSMS 19** → connect to your SQL Server instance (e.g. `localhost` or `localhost\SQLEXPRESS`).
2. Right-click **Databases** → **New Database...**
3. Database name: `HaneusCafeDB` → click **OK**.

**Or via SQL query:**
```sql
CREATE DATABASE HaneusCafeDB;
GO
```

#### 3. Enable SQL Server Login (Mixed Mode)

By default, SQL Server only allows Windows Authentication. You must enable Mixed Mode and create a SQL login before Django can connect.

**Part A — Connect to SSMS with Windows Authentication**

1. Open **SSMS 19**.
2. In the **Connect to Server** dialog, set:
   - Server type: **Database Engine**
   - Server name: **localhost** (or `localhost\SQLEXPRESS` for named instances)
   - Authentication: **Windows Authentication**
3. Click **Connect**.

**Part B — Enable Mixed Authentication Mode**

1. In **Object Explorer** (left panel), right-click the **top server node** (e.g. `DESKTOP-XXXX`) → click **Properties**.
2. In the Server Properties window, click **Security** in the left menu.
3. Under "Server authentication", select **SQL Server and Windows Authentication mode**.
4. Click **OK**.

**Part C — Restart SQL Server**

1. Open **SQL Server Configuration Manager**.
2. Click **SQL Server Services** in the left panel.
3. Right-click **SQL Server (MSSQLSERVER)** → click **Restart**.
4. Wait until the status shows **Running**.

**Part D — Enable TCP/IP (Required for localhost connections)**

1. In SQL Server Configuration Manager, go to **SQL Server Network Configuration** → **Protocols for MSSQLSERVER**.
2. Right-click **TCP/IP** → **Enable**.
3. Double-click **TCP/IP** → **IP Addresses** tab → scroll to **IPAll** → set **TCP Port** to `1433` (clear **TCP Dynamic Ports**).
4. Click **OK** → restart SQL Server again (repeat Part C).

**Part E — Create a SQL Login**

1. Back in **SSMS**, expand the server in Object Explorer.
2. Expand **Security** → right-click **Logins** → click **New Login...**
3. Fill in:
   - Login name: `ProjectSuico` (or your preferred username)
   - Select **SQL Server authentication**
   - Password: `9999` (or your preferred password)
   - Uncheck **Enforce password policy**
4. Click **OK**.

**Part F — Create the Database and Grant Access**

Open a **New Query** window in SSMS and run:

```sql
-- Create the database
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'HaneusCafeDB')
    CREATE DATABASE [HaneusCafeDB];
GO

-- Grant the login access
USE [HaneusCafeDB];
CREATE USER [ProjectSuico] FOR LOGIN [ProjectSuico];
ALTER ROLE [db_owner] ADD MEMBER [ProjectSuico];
GO
```

**Part G — Test the SQL Login**

1. Disconnect from SSMS.
2. Reconnect with:
   - Authentication: **SQL Server Authentication**
   - Login: `ProjectSuico`
   - Password: `9999`
3. If it connects successfully, your SQL Server is ready for Django.

#### 4. Configure .env

Run `python setup_db.py` and choose **B**, or manually create `BACKEND/.env`:

```
DB_ENGINE=mssql
DB_NAME=HaneusCafeDB
DB_USER=sa
DB_PASSWORD=YourStrongPassword
DB_HOST=localhost
DB_PORT=1433
DB_MSSQL_DRIVER=ODBC Driver 17 for SQL Server
```

> For named instances (e.g. `SQLEXPRESS`), set `DB_HOST=localhost\SQLEXPRESS`.

#### 5. Install & Migrate

```bash
cd BACKEND
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
pip install mssql-django pyodbc   # SQL Server driver

python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate

python manage.py createsuperuser
python manage.py runserver
```

#### 6. Verify in SSMS

In SSMS, expand `HaneusCafeDB` → **Tables**. You should see the same tables as listed above.

---

### Frontend

No build tools required — the frontend is plain HTML/CSS/JS.

1. Make sure the Django backend is running (`python manage.py runserver`).
2. Open `FRONTEND/login.html` in your browser.
3. Click **"Sign up here"** to register a new account.
4. Log in using your **Username** and **Password**.

---

## Authentication (Login & Register)

### Registration (`FRONTEND/register.html`)

**Form fields:**
- First Name
- Last Name
- User Name (used for login)
- Email Address
- Password
- Confirm Password
- "I agree to Terms & Privacy" checkbox (required to submit)

**API:** `POST /api/auth/register/`
- **Request:** `{ "first_name", "last_name", "username", "email", "password" }`
- **Success (201):** `{ "success": true, "user": { id, username, email, first_name, last_name } }`
- **Error (400):** validation errors (duplicate username/email, weak password, etc.)

### Login (`FRONTEND/login.html`)

**Form fields:**
- Username (the User Name from registration)
- Password

**API:** `POST /api/auth/login/`
- **Request:** `{ "username": "string", "password": "string" }`
- **Success (200):** `{ "success": true, "user": { id, username, email, first_name, last_name } }`
- **Error (401):** `{ "error": "Invalid username or password." }`

On successful login, user data is stored in `localStorage` and the browser redirects to `dashboard.html`.

---

## API Endpoints

All endpoints prefixed with `/api/`.

### Auth
- `POST /api/auth/register/` — Register a new user
- `POST /api/auth/login/` — Authenticate and return user data

### Products (Clean Architecture)
- `GET /api/products/` — List all products
- `POST /api/products/` — Create a product
- `GET /api/products/<id>/` — Get product detail
- `PUT /api/products/<id>/` — Update a product
- `DELETE /api/products/<id>/` — Delete a product
- `GET /api/products/low-stock/` — List low-stock products

### Orders (Clean Architecture)
- `GET /api/orders/` — List all orders
- `POST /api/orders/` — Create an order (with items)
- `GET /api/orders/<id>/` — Get order detail
- `PUT /api/orders/<id>/` — Update an order
- `DELETE /api/orders/<id>/` — Delete an order
- `POST /api/orders/<id>/cancel/` — Cancel a pending order
- `POST /api/orders/<id>/complete/` — Complete a pending order

### Inventory (Clean Architecture)
- `GET /api/inventory/` — Full inventory summary
- `GET /api/inventory/low-stock/` — Items at/below threshold
- `POST /api/inventory/adjust/` — Record a stock adjustment
- `GET /api/inventory/<product_id>/history/` — Transaction history

### Profile
- `GET /api/profile/<id>/` — Get user profile (first name, last name, email, phone, bio, avatar, joined date)
- `PUT /api/profile/<id>/` — Update profile fields
- `PUT /api/profile/<id>/password/` — Change password (requires current password)

### Dashboard Analytics
- `GET /api/dashboard/` — Aggregated stats: total sales, returns, products, profit, expenses, orders today, monthly sales (12-month array), top selling products, low stock alerts, recent sales, week-over-week % changes for profit/expenses/returns
- `GET /api/dashboard/chart/?period=1Y` — Period-based chart data. Returns `{labels: [...], values: [...]}`. Supported periods: `1D` (24 hourly), `1W` (7 daily), `1M` (daily for month), `3M` (12 weekly), `6M` (6 monthly), `1Y` (12 monthly)

### Sales Analytics
- `GET /api/sales/analytics/` — Returns today's sales total, this week's sales, pending orders count, and average order value

### Uploads
- `POST /api/upload/` — Upload an image file (multipart/form-data, field name: `file`). Returns `{ "url": "/media/uploads/<uuid>.<ext>" }`.

### API Documentation (Scalar)
- `http://localhost:8000/api/docs/` — **Scalar v1** interactive API reference (recommended)
- `http://localhost:8000/api/redoc/` — ReDoc alternative view
- `http://localhost:8000/api/schema/` — Raw OpenAPI 3.0 JSON schema

### Django Admin
- `http://localhost:8000/admin/` — Manage all data

---

## Testing APIs with Scalar v1

Scalar is the interactive API reference UI bundled with this project. It lets you browse, test, and debug every endpoint directly in the browser — no Postman or cURL needed.

### Step 1 — Start the backend

```bash
cd BACKEND
python manage.py runserver
```

Leave this terminal running. The server must stay active at `http://localhost:8000` for all API calls to work.

### Step 2 — Open Scalar in your browser

Go to **http://localhost:8000/api/docs/** (no extra characters — just `/api/docs/`).

You'll see the Scalar API reference page with a sidebar on the left and a test panel on the right.

### Step 3 — Pick an endpoint from the sidebar

The left sidebar groups all endpoints by tag:

- **Auth** — Register & Login
- **Dashboard** — Aggregated statistics
- **Products** — Product CRUD
- **Orders** — Order lifecycle
- **Inventory** — Stock management
- **Profile** — User profile read/update + password change
- **Uploads** — Image upload for products and avatars

Click any endpoint name to expand it. You'll see:
- The HTTP method and URL
- A description of what it does
- The request body schema (for POST/PUT)
- The response schema with example values

### Step 4 — Send a request (GET endpoints)

For **GET** endpoints, no request body is needed.

1. Click an endpoint, e.g. **GET /api/dashboard/**.
2. On the right side, you'll see the **"Test Request"** panel with the URL pre-filled.
3. Click the **"Send"** button.
4. The response appears below — status code, headers, and the JSON body.

Other GET endpoints to try:
- **GET /api/products/** — returns the full product list
- **GET /api/products/low-stock/** — returns products at or below their stock threshold
- **GET /api/orders/** — returns all orders
- **GET /api/inventory/** — returns inventory summary for every product

### Step 5 — Send a request (POST/PUT endpoints)

For **POST** and **PUT** endpoints, Scalar pre-populates an editable request body from the OpenAPI schema.

#### Example: Register a new user

1. In the sidebar, click **Auth → POST /api/auth/register/**.
2. In the request body editor on the right, fill in:
   ```json
   {
     "first_name": "John",
     "last_name": "Doe",
     "username": "johndoe",
     "email": "john@example.com",
     "password": "MySecurePass123"
   }
   ```
3. Click **Send**.
4. Expected response — `201 Created`:
   ```json
   {
     "success": true,
     "user": {
       "id": 1,
       "username": "johndoe",
       "email": "john@example.com",
       "first_name": "John",
       "last_name": "Doe"
     }
   }
   ```

#### Example: Log in

1. Click **Auth → POST /api/auth/login/**.
2. Fill in:
   ```json
   {
     "username": "johndoe",
     "password": "MySecurePass123"
   }
   ```
3. Click **Send** → `200 OK` with the user object.

#### Example: Create a product

1. Click **Products → POST /api/products/**.
2. Fill in:
   ```json
   {
     "name": "Cappuccino",
     "category": "Beverages",
     "price": 4.50,
     "cost": 1.20,
     "stock": 100
   }
   ```
3. Click **Send** → `201 Created` with the full product object (including `id`, `stock_status`, timestamps).

#### Example: Create an order

1. Click **Orders → POST /api/orders/**.
2. Fill in (use a `product_id` that exists — e.g. `1` from the product you just created):
   ```json
   {
     "order_id": "ORD-001",
     "customer_name": "Juan Dela Cruz",
     "date": "2026-03-09T12:00:00Z",
     "status": "Pending",
     "items": [
       { "product_id": 1, "quantity": 2, "unit_price": 4.50 }
     ]
   }
   ```
3. Click **Send** → `201 Created`.

#### Example: Adjust stock

1. Click **Inventory → POST /api/inventory/adjust/**.
2. Fill in:
   ```json
   {
     "product_id": 1,
     "quantity_change": -5,
     "transaction_type": "stock_out",
     "reference": "Daily usage",
     "notes": "Used for morning orders"
   }
   ```
3. Click **Send** → `201 Created` with the transaction record.

### Step 6 — Endpoints with URL parameters

Some endpoints have path parameters like `/api/products/<id>/`.

1. Click the endpoint, e.g. **GET /api/products/{id}/**.
2. Scalar shows a **Path Parameters** section — type the ID (e.g. `1`).
3. Click **Send** → returns that specific product.

This works the same for:
- **PUT /api/products/{id}/** — update a product (fill in the fields you want to change)
- **DELETE /api/products/{id}/** — delete a product
- **POST /api/orders/{id}/cancel/** — cancel a pending order
- **POST /api/orders/{id}/complete/** — complete a pending order
- **GET /api/inventory/{product_id}/history/** — view stock transaction history

### Step 7 — Verify on the Dashboard

After creating products and orders via Scalar:

1. Open **FRONTEND/dashboard.html** in your browser.
2. The dashboard fetches `GET /api/dashboard/` automatically and displays:
   - Total Sales, Sales Returns, Total Products
   - Profit, Expenses, Payment Returns
   - Monthly sales bar chart
   - Top selling products
   - Low stock alerts
   - Recent sales

All values are computed from your real database data.

### Tips

- **Response codes** are color-coded: green (2xx), yellow (4xx), red (5xx).
- You can switch between different **response examples** in the schema to see what success vs. error responses look like.
- The **raw OpenAPI schema** is available at `http://localhost:8000/api/schema/` if you want to import it into Postman or other tools.
- If you see CORS errors, make sure `CORS_ALLOW_ALL_ORIGINS = True` is set in `config/settings.py` (it is by default).
- **Common mistake:** visiting `http://localhost:8000/api/docs/**` (with extra `**`) gives a 404 — the correct URL is `http://localhost:8000/api/docs/` (just a trailing slash).

---

## Clean Architecture Layers

### Domain Layer (`domain/entities/`)
Pure Python classes with business rules. No Django imports.
- `Product` — stock status, profit margin, stock adjustment, validation
- `Order` / `OrderItem` — order lifecycle (cancel, complete, refund), totals
- `InventoryTransaction` / `InventoryItem` — restock suggestions, critical stock detection

### Application Layer (`application/`)
- **Services** — Orchestrate business operations using domain entities and repository interfaces.
- **DTOs** — Data transfer objects with `from_entity()` and `to_dict()` converters.
- **Interfaces** — Abstract base classes (ABC) that define repository contracts.

### Infrastructure Layer (`infrastructure/`)
- **Models** — Django ORM models mapped to database tables.
- **Repositories** — Concrete implementations that translate between ORM models and domain entities.
- **DB Context** — Transaction management and connection utilities.

### API Layer (`api/controllers/`)
Thin DRF `APIView` controllers. No business logic — only request parsing and response formatting.

---

## Troubleshooting

### "Unknown database 'haneus-inventory'"
Create the database first. See XAMPP Step 2 or SSMS Step 2 above.

### "Table already exists"
```bash
python manage.py migrate --fake
python manage.py migrate
```
Or drop and recreate the database, then run `migrate` again.

### "Cannot connect to server" from frontend
CORS is already enabled in settings:
```python
CORS_ALLOW_ALL_ORIGINS = True
```
Make sure the Django server is running and restart it after any settings change.

### "TCP Provider: No connection could be made" (SQL Server)
1. Open **SQL Server Configuration Manager**.
2. Go to **SQL Server Network Configuration** → **Protocols for MSSQLSERVER**.
3. Enable **TCP/IP** → double-click → **IP Addresses** tab → scroll to **IPAll** → set **TCP Port** to `1433` (clear **TCP Dynamic Ports**).
4. Restart SQL Server: `Restart-Service -Name "MSSQLSERVER" -Force`
5. Verify: `netstat -an | findstr "1433"` should show `LISTENING`.

### "Login failed" or "SQL Server Authentication" error
1. In SSMS, connect with **Windows Authentication**.
2. Right-click server → **Properties** → **Security** → select **SQL Server and Windows Authentication mode**.
3. Restart SQL Server.
4. Create the login and database (see Option B, Step 2 above).

### "No module named 'mysqlclient'" or "No module named 'mssql'"
Install the correct driver:
```bash
pip install mysqlclient          # for MySQL/XAMPP
pip install mssql-django pyodbc   # for SQL Server/SSMS
```

### Migration conflicts between api and infrastructure
Run migrations for each app explicitly:
```bash
python manage.py makemigrations api
python manage.py makemigrations infrastructure
python manage.py migrate
```

---

## What Was Implemented

1. **Clean Architecture backend** — Four-layer architecture (Domain → Application → Infrastructure → API) with strict dependency rules.
2. **Domain entities** — `Product`, `Order`, `OrderItem`, `InventoryTransaction`, `InventoryItem` with pure business logic.
3. **Application services** — `ProductService`, `OrderService`, `InventoryService`, `DashboardService` with DTOs and repository interfaces.
4. **Infrastructure repositories** — `ProductRepository`, `OrderRepository`, `InventoryRepository`, `DashboardRepository` using Django ORM.
5. **DRF API controllers** — RESTful endpoints for products, orders, and inventory management.
6. **User authentication** — Registration (first name, last name, username, email, password) and login with custom User model.
7. **Flexible database config** — Supports MySQL (XAMPP) and SQL Server (SSMS 19) via `DB_ENGINE` env var.
8. **Interactive database setup** — `setup_db.py` script that guides the user through database selection and `.env` generation.
9. **Scalar API documentation** — OpenAPI 3.0 schema via `drf-spectacular`, served with Scalar v1 UI at `/api/docs/`.
10. **Frontend pages** — Login, register, dashboard, products, stock management, sales, and profile pages.
11. **Merged configuration** — Unified `manage.py`, `requirements.txt`, `.env.example` for both legacy and clean architecture.
12. **CORS support** — `django-cors-headers` configured for frontend-backend communication during development.
13. **Dashboard backend** — Aggregated statistics endpoint (`GET /api/dashboard/`) with total sales, returns, profit, expenses, monthly sales chart data, top selling products, low stock alerts, and recent sales — all computed from real database data.

### Sprint 1 — Inventory CRUD, Image Upload & Profile

14. **Image upload endpoint** — `POST /api/upload/` accepts `multipart/form-data`, validates image types (jpg, jpeg, png, gif, webp), saves with UUID filename to `MEDIA_ROOT/uploads/`, returns the served URL.
15. **Profile API** — `GET /PUT /api/profile/<id>/` for reading/updating user details (first name, last name, email, phone, bio, avatar URL). `PUT /api/profile/<id>/password/` for password change with current-password verification.
16. **User model extended** — Added `phone`, `bio`, `avatar_url` fields to the custom User model.
17. **Products page** (`products.html`) — Dynamically fetches `GET /api/products/`, renders table, supports inline edit via `PUT` and delete via `DELETE`.
18. **Create Product page** (`createproduct.html`) — Uploads product image via `/api/upload/` first, then creates product via `POST /api/products/` with the returned `image_url`.
19. **Low Stock page** (`lowstock.html`) — Fetches `GET /api/products/low-stock/`, displays critical/low status with progress bars. Restock button calls `POST /api/inventory/adjust/` with `transaction_type: restock`.
20. **Manage Stock page** (`managestock.html`) — Lists all products from `GET /api/products/`, +/- stock adjustment calls `POST /api/inventory/adjust/`, "View log" loads real transaction history from `GET /api/inventory/<id>/history/`.
21. **Profile page** (`profile.html`) — Loads user data from `GET /api/profile/<id>/`, saves changes via `PUT`, uploads avatar through `/api/upload/`, and changes password via `PUT /api/profile/<id>/password/`. User ID is read from `localStorage` (set during login).
22. **Frontend category alignment** — All `<select>` options match backend category values: Beverages, Desserts, Pastries, Ingredients, Merchandise.
23. **Media file serving** — Django serves uploaded images in development via `MEDIA_URL = /media/` and `MEDIA_ROOT` configured in `settings.py`.

### Sprint 1 (continued) — Dashboard Analytics, Sales Backend & Bar Chart

24. **Dashboard weekly comparison** — `GET /api/dashboard/` now returns `profit_change_pct`, `expenses_change_pct`, `returns_change_pct` calculated as week-over-week percentage changes using period-based revenue/expense/returns queries.
25. **Period-based bar chart** — `GET /api/dashboard/chart/?period=1Y` endpoint returns `{labels, values}` for 6 period modes (1D hourly, 1W daily, 1M daily, 3M weekly, 6M monthly, 1Y monthly). Frontend period buttons dynamically rebuild bars and labels.
26. **Sales Analytics endpoint** — `GET /api/sales/analytics/` computes today's completed sales, this week's sales, pending order count, and average completed order value — all from real database aggregation queries.
27. **Sales page** (`sales.html`) — Full API rewrite: summary cards from `/api/sales/analytics/`, orders table from `GET /api/orders/`, client-side search/status/date filters, View modal fetches order detail with line items, Refund calls `POST /api/orders/<pk>/cancel/`.
28. **Dashboard data algorithms** — Top Selling uses `GROUP BY product_name ORDER BY SUM(qty*price) DESC`; Low Stock uses `WHERE stock <= threshold ORDER BY stock ASC`; Recent Sales uses latest 5 orders with prefetched items; Monthly chart uses `ExtractMonth` aggregation; Profit = revenue - COGS.
