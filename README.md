# Haneus Cafe POS

A comprehensive coffee shop point-of-sale and management system with inventory tracking, sales management, and an admin dashboard.

---

## Project Structure

```
POS/
├── FRONTEND/                         # React + TypeScript frontend
│   ├── components/
│   │   └── Layout.tsx            # Main layout with sidebar and header
│   ├── pages/
│   │   ├── Dashboard.tsx         # Dashboard with stats, charts, top-selling
│   │   ├── Login.tsx             # User login page
│   │   ├── Register.tsx          # User registration page
│   │   ├── Products.tsx          # Product list table with actions
│   │   ├── CreateProduct.tsx     # Create new product form
│   │   ├── LowStock.tsx          # Low stock alerts table
│   │   ├── ManageStock.tsx       # Stock adjustment interface
│   │   ├── Sales.tsx             # Sales & orders table
│   │   └── Profile.tsx           # User profile & settings
│   ├── services/
│   │   └── api.ts                # Axios API service (connects to Django)
│   ├── App.tsx                   # React Router setup with auth guards
│   ├── main.tsx                  # React entry point
│   ├── types.ts                  # TypeScript interfaces (User, Product, Sale)
│   └── index.css                 # Tailwind CSS theme config
│
├── BACKEND/                      # Python + Django backend
│   ├── pos_core/                 # Django project configuration
│   │   ├── __init__.py
│   │   ├── settings.py           # Settings with flexible DB selection
│   │   ├── urls.py               # Root URL routing
│   │   ├── wsgi.py               # WSGI entry point
│   │   └── asgi.py               # ASGI entry point
│   ├── api/                      # Django REST Framework API app
│   │   ├── __init__.py
│   │   ├── apps.py               # App config
│   │   ├── models.py             # Product and Sale models
│   │   ├── serializers.py        # DRF serializers for all models
│   │   ├── views.py              # CRUD views (list, create, update, delete)
│   │   ├── urls.py               # API endpoint routing
│   │   └── admin.py              # Django admin registration
│   ├── python/                   # Python utility scripts
│   │   ├── __init__.py
│   │   └── db_config.py          # Database connection test utility
│   ├── manage.py                 # Django management command entry
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Backend environment variable template
│
├── .env.example                  # Frontend environment variable template
├── .gitignore                    # Ignore rules for Node, Python, OS files
├── index.html                    # HTML entry point
├── package.json                  # Node.js dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite config (port 3005, API proxy)
└── metadata.json                 # Project metadata
```

---

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (dev server on port 3005)
- Tailwind CSS v4
- Lucide React (icons)
- Motion (animations)
- Axios (HTTP client)
- React Router v7

**Backend:**
- Python + Django 4.2
- Django REST Framework
- django-cors-headers

**Database (choose one):**
- MySQL via XAMPP
- Microsoft SQL Server via SSMS 19

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- **XAMPP** (for MySQL) OR **SQL Server + SSMS 19** (for MSSQL) — at least one is required

### 1. Frontend Setup

Run these from the **project root** (where `package.json` is):

```bash
# Install Node.js dependencies
npm install

# Start the dev server (runs on http://localhost:3005)
npm run dev

# Build for production
npm run build
```

### 2. Backend Setup

```bash
# Navigate to the backend folder
cd BACKEND

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install core Python dependencies
pip install -r requirements.txt

# (Optional) Install your database driver:
#   For XAMPP / MySQL:
pip install mysqlclient
#   For SSMS / SQL Server:
pip install mssql-django pyodbc

# Run database migrations
python manage.py migrate

# Create a superuser for Django admin
python manage.py createsuperuser

# Start the Django dev server (runs on http://localhost:8000)
python manage.py runserver
```

### 3. Database Configuration

The backend supports two database engines. Set `DB_ENGINE` in your environment (or create a `BACKEND/.env` file based on `BACKEND/.env.example`).

---

#### Option A: MySQL via XAMPP (default)

**Step 1 — Install & start XAMPP**
1. Download and install XAMPP from https://www.apachefriends.org.
2. Open the **XAMPP Control Panel**.
3. Click **Start** next to **Apache** and **MySQL**. Both should turn green.

**Step 2 — Create the database in phpMyAdmin**
1. Open your browser and go to `http://localhost/phpmyadmin`.
2. Click the **Databases** tab at the top.
3. In the "Create database" field, type `Haneus-Inventory`.
4. Select `utf8mb4_general_ci` as the collation.
5. Click **Create**.
6. You should now see `Haneus-Inventory` listed in the left sidebar.

**Step 3 — Set environment variables**
Create a file `BACKEND/.env` (or set these in your terminal):
```
DB_ENGINE=mysql
DB_NAME=Haneus-Inventory
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
```

**Step 4 — Install the Python MySQL driver**
```bash
pip install mysqlclient
```

**Step 5 — Run migrations and start Django**
```bash
cd BACKEND
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Viewing your data:**
- Go to `http://localhost/phpmyadmin`, click `Haneus-Inventory` in the sidebar, and you will see all the Django tables (e.g., `api_product`, `api_sale`, `users`).
- The `users` table stores all admin user accounts.
- Click any table to browse, insert, edit, or delete rows.

---

#### Option B: Microsoft SQL Server via SSMS 19

**Step 1 — Install SQL Server and SSMS 19**
1. Download and install **SQL Server 2022 Express** (free) from https://www.microsoft.com/en-us/sql-server/sql-server-downloads.
2. During setup, note down the **instance name** (default: `localhost` or `localhost\SQLEXPRESS`).
3. Download and install **SQL Server Management Studio (SSMS) 19** from https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms.

**Step 2 — Enable SQL Server Authentication**
1. Open **SSMS 19** and connect to your SQL Server instance.
2. Right-click your server name in Object Explorer and select **Properties**.
3. Go to the **Security** page.
4. Under "Server authentication", select **SQL Server and Windows Authentication mode**.
5. Click **OK**, then **restart the SQL Server service** (right-click server > Restart).

**Step 3 — Set the `sa` account password**
1. In Object Explorer, expand **Security > Logins**.
2. Right-click **sa** and select **Properties**.
3. Set a new password under the **General** page.
4. Go to the **Status** page and set **Login** to **Enabled**.
5. Click **OK**.

**Step 4 — Create the database**
1. In Object Explorer, right-click **Databases** and select **New Database...**.
2. Enter `HaneusCafeDB` as the database name.
3. Click **OK**.
4. You should now see `HaneusCafeDB` listed under Databases.

**Step 5 — Install the ODBC Driver**
1. Download and install **ODBC Driver 17 for SQL Server** from https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server.

**Step 6 — Set environment variables**
Create a file `BACKEND/.env` (or set these in your terminal):
```
DB_ENGINE=mssql
DB_NAME=HaneusCafeDB
DB_USER=sa
DB_PASSWORD=your_sa_password
DB_HOST=localhost
DB_PORT=1433
```

**Step 7 — Install the Python SQL Server drivers**
```bash
pip install mssql-django pyodbc
```

**Step 8 — Run migrations and start Django**
```bash
cd BACKEND
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Viewing your data in SSMS 19:**
1. Open SSMS 19 and connect to your server.
2. In Object Explorer, expand **Databases > HaneusCafeDB > Tables**.
3. You will see Django tables such as `dbo.api_product`, `dbo.api_sale`, `dbo.users`.
4. Right-click any table and select **Select Top 1000 Rows** to view the data.
5. To edit data directly, right-click a table and select **Edit Top 200 Rows**.

---

#### Testing your database connection

Before running Django, you can verify your database is reachable:
```bash
cd BACKEND
python python/db_config.py
```

---

## Login Page (`FRONTEND/login.html`)

The login page is connected to the Django backend at `http://localhost:8000/api/auth/login/`.

**How it works:**
1. User enters their **Username** (which is their email address from registration) and **Password**.
2. The form sends a `POST` request with `{ "username": "...", "password": "..." }` to the backend.
3. On success, the backend returns `{ "success": true, "user": { id, username, email, first_name, last_name } }`.
4. The user data is saved to `localStorage` and the browser redirects to `dashboard.html`.
5. On failure, an error message is displayed below the form.

**Database table:** Admin user accounts are stored in the `users` table (custom Django user model).

**Registration note:** When a user registers via `register.html`, their email is used as both `username` and `email`. So to log in, they enter their email in the "Username" field.

### API Endpoint Used

`POST /api/auth/login/`

- **Request body:** `{ "username": "string", "password": "string" }`
- **Success response (200):** `{ "success": true, "user": { "id", "username", "email", "first_name", "last_name" } }`
- **Error response (401):** `{ "error": "Invalid username or password." }`
- **Defined in:** `BACKEND/api/urls.py` → `path("auth/login/", views.LoginView.as_view())`

### Python Files Implemented

| File | What was changed |
|------|------------------|

- **`BACKEND/api/models.py`** — Added `User` model extending `AbstractUser` with `db_table = "users"`. This creates the `users` table in the `Haneus-Inventory` database instead of Django's default `auth_user`.
- **`BACKEND/api/views.py`** — `LoginView` receives `username` + `password`, calls `django.contrib.auth.authenticate()`, and returns user data via `UserSerializer` on success or `401` on failure.
- **`BACKEND/api/serializers.py`** — `LoginSerializer` validates incoming `username` (CharField) and `password` (CharField). `UserSerializer` serializes the response with fields: `id`, `username`, `email`, `first_name`, `last_name`.
- **`BACKEND/api/urls.py`** — Maps `auth/login/` to `LoginView` (no change needed, already mapped).
- **`BACKEND/api/admin.py`** — Registered custom `User` model with Django's `UserAdmin` so admin users can be managed at `http://localhost:8000/admin/`.
- **`BACKEND/pos_core/settings.py`** — Added `AUTH_USER_MODEL = "api.User"` to tell Django to use the custom User model. Default `DB_NAME` changed to `Haneus-Inventory`.

---

## API Endpoints (CRUD)

All endpoints are prefixed with `/api/`.

**Authentication:**
- `POST /api/auth/register/` — Register a new admin user (sends: `name`, `email`, `password`)
- `POST /api/auth/login/` — Login with username + password, returns user data

**Products (full CRUD):**
- `GET /api/products/` — List all products
- `POST /api/products/` — Create a new product
- `GET /api/products/<id>/` — Get product detail
- `PUT /api/products/<id>/` — Update a product
- `DELETE /api/products/<id>/` — Delete a product

**Sales (full CRUD):**
- `GET /api/sales/` — List all sales
- `POST /api/sales/` — Create a new sale
- `GET /api/sales/<id>/` — Get sale detail
- `PUT /api/sales/<id>/` — Update a sale
- `DELETE /api/sales/<id>/` — Delete a sale

**Django Admin Panel:**
- `http://localhost:8000/admin/` — Manage data via Django admin

---

## What Was Updated

1. **TypeScript conversion verified** — all frontend files use `.tsx` / `.ts` with proper type annotations.
2. **Removed all 
3. **Frontend port fixed to 3005** — `vite.config.ts` sets `server.port: 3005` with `strictPort: true`; both `npm run dev` and `npm run preview` use port 3005.
4. **Django backend created** — Full Python/Django REST Framework backend with CRUD for Products, Sales, and User authentication.
5. **Flexible database configuration** — `BACKEND/pos_core/settings.py` reads `DB_ENGINE` env var to switch between MySQL (XAMPP) and SQL Server (SSMS).
6. **Backend folder structure** — Separated into `pos_core/` (Django config), `api/` (REST API), and `python/` (utility scripts).
7. **API proxy configured** — Vite proxies `/api` requests to Django on `localhost:8000` during development.
8. **Express backend removed** — `server.ts` and related Node.js dependencies (`express`, `tsx`, `dotenv`) removed.
9. **Axios added** — `axios` added to `package.json` (required by `FRONTEND/services/api.ts`).
10. **.gitignore updated** — Covers Node.js (`node_modules/`, `dist/`), Python (`__pycache__/`, `venv/`, `*.pyc`), Django (`staticfiles/`), and OS/IDE files.
11. **README fully rewritten** — Project structure, setup instructions, database config guide, and API documentation.

---

## Potential Backend Work (Frontend Connection)

The following frontend features currently use hardcoded demo data and will need to be connected to the Django backend API:

1. **Dashboard (`Dashboard.tsx`)** — Stats (total sales, returns, product count), chart data, and top-selling products need dedicated API endpoints (e.g., `/api/dashboard/stats/`, `/api/dashboard/top-selling/`).
2. **Products page (`Products.tsx`)** — Currently renders a static list; needs to fetch from `GET /api/products/` and wire up Edit/Delete buttons to `PUT`/`DELETE` endpoints.
3. **Create Product (`CreateProduct.tsx`)** — Form submission needs to call `POST /api/products/` with form data including image upload support.
4. **Low Stock (`LowStock.tsx`)** — Needs a filtered endpoint like `GET /api/products/?stock_status=low` or a dedicated `/api/products/low-stock/` endpoint.
5. **Manage Stock (`ManageStock.tsx`)** — Adjust buttons need to call a stock update endpoint (e.g., `PATCH /api/products/<id>/` with stock delta).
6. **Sales (`Sales.tsx`)** — Needs to fetch from `GET /api/sales/` with filter/search query params.
7. **Login (`login.html`)** — ✅ Connected to Django backend via `POST /api/auth/login/`. Stores user data in localStorage on success.
8. **Register (`register.html`)** — Currently uses demo alert; needs to call `POST /api/auth/register/`.
8. **Profile (`Profile.tsx`)** — Needs a `GET/PUT /api/auth/profile/` endpoint for reading and updating user details.
9. **Search functionality** — The global search bar in the header needs a backend search endpoint.
10. **Image uploads** — Product images need Django media file handling (`MEDIA_ROOT`, `MEDIA_URL`) and a file upload endpoint.
11. **JWT / Token authentication** — Consider adding `djangorestframework-simplejwt` for proper token-based auth between frontend and backend.
