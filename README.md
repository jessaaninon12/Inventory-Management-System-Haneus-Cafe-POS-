# Haneus Cafe POS

A full-stack point-of-sale and inventory management system for coffee shops, featuring inventory tracking, sales management, and an admin dashboard.

---

## Project Structure

```
Inventory-Management-System-Haneus-Cafe-POS/
│
├── BACKEND/                  # Django backend (API, business logic, DB)
│   ├── api/                  # Django app for API endpoints
│   │   ├── admin.py          # Django admin registration (User, Product, Sale)
│   │   ├── apps.py
│   │   ├── models.py         # User, Product, Sale models
│   │   ├── serializers.py    # DRF serializers
│   │   ├── urls.py           # API endpoint routing
│   │   └── views.py          # Auth, Product, Sale views
│   ├── pos_core/             # Django project core settings
│   │   ├── settings.py       # DB config, AUTH_USER_MODEL, CORS
│   │   ├── urls.py           # Root URL routing
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── python/               # Utility scripts
│   │   └── db_config.py      # Database connection test
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── FRONTEND/                 # Frontend (HTML, CSS, vanilla JS)
│   ├── login.html            # Login page (connected to backend)
│   ├── register.html         # Registration page
│   ├── dashboard.html        # Admin dashboard
│   ├── products.html         # Product list
│   ├── createproduct.html    # Create product form
│   ├── lowstock.html         # Low stock alerts
│   ├── managestock.html      # Stock management
│   ├── sales.html            # Sales & orders
│   └── profile.html          # User profile
│
├── index.html                # Redirects to FRONTEND/login.html
├── .env.example              # Environment variable template
├── .gitignore
├── metadata.json
└── README.md
```

---

## Tech Stack

**Frontend:**
- HTML, CSS, vanilla JavaScript
- Lucide Icons (via CDN)
- Google Fonts (Inter)

**Backend:**
- Python 3.10+
- Django 4.2
- Django REST Framework
- django-cors-headers

**Database:**
- MySQL via XAMPP

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- XAMPP (for MySQL and Apache)

### 1. XAMPP & Database Setup

#### Step 1: Start XAMPP Services
1. Open **XAMPP Control Panel**.
2. Click **Start** next to **Apache**.
3. Click **Start** next to **MySQL**.
4. Both should show a green "Running" status.

#### Step 2: Create the Database

**Option A — Via phpMyAdmin UI:**
1. Open your browser and go to `http://localhost/phpmyadmin`.
2. Click the **Databases** tab at the top.
3. In the "Create database" field, type: `Haneus-Inventory`
4. Select collation: `utf8mb4_general_ci`
5. Click **Create**.

**Option B — Via phpMyAdmin SQL tab (recommended):**
1. Open `http://localhost/phpmyadmin`.
2. Click the **SQL** tab at the top.
3. Paste and run this query:

```sql
CREATE DATABASE `Haneus-Inventory`
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
```

This guarantees the correct charset and collation.

#### Step 3: Configure Environment Variables

Create a file `BACKEND/.env` based on `BACKEND/.env.example`:

```
DB_ENGINE=mysql
DB_NAME=Haneus-Inventory
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
```

> **Note:** XAMPP's default MySQL user is `root` with no password. If you changed this, update accordingly.

### 2. Backend Setup (Command Prompt / Terminal)

Open a terminal (Command Prompt or PowerShell) and run the following:

```bash
# Navigate to the backend folder
cd BACKEND

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate          # Windows (Command Prompt / PowerShell)
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt
pip install mysqlclient         # MySQL driver for XAMPP

# Generate migration files
python manage.py makemigrations

# Apply migrations to the database
python manage.py migrate

# (Optional) Create a Django admin superuser
python manage.py createsuperuser

# Start the development server
python manage.py runserver      # Runs at http://localhost:8000
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### 3. Frontend

No build step required. The frontend is plain HTML/CSS/JS.

1. Open `FRONTEND/login.html` directly in your browser.
2. To register, click "Sign up here" → fill in Name, Email, Password, Confirm Password → click Sign Up.
3. After registration, log in using your **email** as the Username and your password.

> **Important:** Make sure the Django backend (`python manage.py runserver`) is running before using the frontend pages.

### 4. Viewing Your Data in phpMyAdmin

1. Go to `http://localhost/phpmyadmin`.
2. Click `Haneus-Inventory` in the left sidebar.
3. Key tables:
   - `users` — All registered user accounts
   - `api_product` — Products/inventory items
   - `api_sale` — Sales/order records

---

## Troubleshooting

### "Unknown database 'haneus-inventory'"
The database hasn't been created yet. Follow **Step 2** above to create it in phpMyAdmin.

### "Table 'django_admin_log' already exists"
This happens when the database has leftover tables from a previous migration. Fix:

**Option A — Fake the failing migration:**
```bash
python manage.py migrate admin --fake
python manage.py migrate
```

**Option B — Fresh start (drop and recreate the database):**
1. In phpMyAdmin, select `Haneus-Inventory` → click **Drop**.
2. Re-create the database using the SQL query:
```sql
CREATE DATABASE `Haneus-Inventory`
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
```
3. Run `python manage.py migrate` again.

### "Cannot connect to server" (from the frontend)
This is a CORS issue when opening HTML files directly via `file://`. The fix is already applied in `BACKEND/pos_core/settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # Allow all origins during development
```
Make sure you **restart the Django server** after any settings change (Ctrl+C, then `python manage.py runserver`).

### Registration form shows "Sign up attempt... (demo successful!)"
Your browser is using a cached version of `register.html`. Press **Ctrl + Shift + R** (hard refresh) to clear the cache.

---

## Adding New Models / Tables

When you need to add a new database table (e.g. for a new feature), follow these steps:

### Step 1: Define the Model

Add a new class in `BACKEND/api/models.py`. Example:

```python
class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "categories"   # Custom table name (optional)
        ordering = ["name"]

    def __str__(self):
        return self.name
```

### Step 2: Generate and Apply Migrations

Run these commands in the `BACKEND` folder (with venv activated):

```bash
python manage.py makemigrations    # Generates a new migration file in api/migrations/
python manage.py migrate            # Applies it to the MySQL database
```

You should see output like:
```
Migrations for 'api':
  api\migrations\0002_category.py
    - Create model Category
```

### Step 3: Verify in phpMyAdmin

Go to `http://localhost/phpmyadmin` → click `Haneus-Inventory` → the new table should appear.

### Step 4: (Optional) Add API Endpoints

To expose the new table via the API:
1. Create a serializer in `BACKEND/api/serializers.py`.
2. Create views in `BACKEND/api/views.py`.
3. Add URL routes in `BACKEND/api/urls.py`.
4. Register in `BACKEND/api/admin.py` (for Django admin panel).

> **Important:** Always run `makemigrations` then `migrate` after changing models. Never manually create tables in phpMyAdmin — let Django handle it.

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

- **`BACKEND/api/models.py`** — Added `User` model extending `AbstractUser` with `db_table = "users"`. This creates the `users` table in the `Haneus-Inventory` database instead of Django's default `auth_user`.
- **`BACKEND/api/views.py`** — `LoginView` receives `username` + `password`, calls `django.contrib.auth.authenticate()`, and returns user data via `UserSerializer` on success or `401` on failure.
- **`BACKEND/api/serializers.py`** — `LoginSerializer` validates incoming `username` (CharField) and `password` (CharField). `UserSerializer` serializes the response with fields: `id`, `username`, `email`, `first_name`, `last_name`.
- **`BACKEND/api/urls.py`** — Maps `auth/login/` to `LoginView`.
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

1. **Django backend created** — Full Python/Django REST Framework backend with CRUD for Products, Sales, and User authentication.
2. **Custom User model** — `api.User` extends `AbstractUser` with `db_table = "users"`. Set via `AUTH_USER_MODEL = "api.User"` in settings.
3. **Login page connected** — `FRONTEND/login.html` sends `POST /api/auth/login/` to Django backend, stores user data in `localStorage`, redirects to dashboard.
4. **Flexible database configuration** — `BACKEND/pos_core/settings.py` reads `DB_ENGINE` env var. Default database: `Haneus-Inventory` (MySQL via XAMPP).
5. **Backend folder structure** — Separated into `pos_core/` (Django config), `api/` (REST API), and `python/` (utility scripts).
6. **Frontend is pure HTML/CSS/JS** — No build tools required. Lucide Icons loaded via CDN.
7. **.gitignore updated** — Covers Python (`__pycache__/`, `venv/`, `*.pyc`), Django (`staticfiles/`), and OS/IDE files.
