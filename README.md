# Inventory Management System – Haneus Cafe POS

This system is a Point of Sale and Inventory Management application designed for Haneus Cafe. It supports two user roles: Admin and Staff. Each role has its own set of features and access permissions. Admins can manage users, products, inventory, orders, and view analytics. Staff can access products, stock management, and the dashboard.

---

## Tech Stack

The backend is built using Python with the Django framework and follows a Clean Architecture structure. The frontend uses HTML, CSS, and JavaScript for the user interface. The system supports both SQL Server through SSMS 19 and MySQL through XAMPP as database engines. The API follows a RESTful design and is documented using OpenAPI 3.0 with a Scalar interface.

---

## Project Structure

The backend is organized into four layers. The domain layer contains pure business logic with no external dependencies. The application layer holds services, data transfer objects, and repository interfaces. The infrastructure layer handles database models and concrete repository implementations. The API layer contains thin controllers that process HTTP requests and return responses.

The frontend contains separate HTML pages for login, registration, dashboard, products, stock management, sales, user management, and profile. Each page has a corresponding CSS file for styling and a JavaScript file for logic and API communication.

---

## Ports and API

The backend server runs on localhost using port 8000. The API base URL is:

```
http://localhost:8000/api/scaler/v1
```

All endpoints for products, authentication, users (admin and staff), inventory, orders, and analytics follow this base path. The interactive API reference is available at that URL once the server is running.

---

## Installation Requirements

The user must have Python and pip installed on their machine. A virtual environment must be created before installing dependencies. The user must choose one database engine, either SQL Server through SSMS 19 or MySQL through XAMPP, depending on their environment. No manual database creation is required. The database is created automatically when the setup script runs, before any migration commands are executed.

To set up the environment, run the following commands inside the BACKEND folder.

Create and activate the virtual environment:

```
python -m venv venv
venv\Scripts\activate
```

Install all required dependencies:

```
pip install -r requirements.txt
```

For MySQL, also install the MySQL driver:

```
pip install mysqlclient
```

For SQL Server, also install the SQL Server driver:

```
pip install mssql-django pyodbc
```

---

## Select Database Engine

The developer can choose between SQL Server or MySQL by setting the DB_ENGINE variable in the .env file.

SQL Server supports both SQL Server Authentication and Windows Authentication. It works with the default SQL Server instance, SQLEXPRESS, or LocalDB. The system will try multiple server configurations automatically if the primary connection fails.

MySQL can be used through XAMPP with the default local configuration. The default user is root with no password. The system connects to port 3306 by default.

To configure the database, run the interactive setup script:

```
python setup_db.py
```

This script will ask for the database engine and connection details, then generate a .env file automatically. It also creates the database immediately after the .env is written. No manual database creation is needed in SSMS or phpMyAdmin before running migrations.

---

## Running the Project

Follow these steps in order to run the project.

Step 1. Activate the virtual environment.

```
venv\Scripts\activate
```

Step 2. Run the setup script. This generates the .env file and creates the database automatically.

```
python setup_db.py
```

Choose A for MySQL via XAMPP or B for SQL Server via SSMS 19. Press Enter to accept the default values shown in brackets. The script will print a confirmation line when the database is ready, for example:

```
[db_init] MySQL/MariaDB: database 'haneuscafedb' is ready (host: 127.0.0.1:3306).
```

or for SQL Server:

```
[db_init] SQL Server: database 'haneuscafedb' is ready (server: localhost,1433, auth: Windows Authentication).
```

Step 3. Generate migration files.

```
python manage.py makemigrations api
python manage.py makemigrations infrastructure
```

Because the database already exists after Step 2, no warnings will appear here.

Step 4. Apply migrations. This creates all tables in the database.

```
python manage.py migrate
```

Step 5. Start the development server.

```
python manage.py runserver
```

The server will be available at http://127.0.0.1:8000. Open the API reference at http://localhost:8000/api/scaler/v1 to browse and test all endpoints.

---

## Migration Commands

The project supports two sets of migration commands. Both sets produce the same result.

Standard Django commands:

```
python manage.py makemigrations
python manage.py migrate
```

Entity Framework style aliases:

```
python manage.py add_migration
python manage.py update_database
```

The add_migration command is an alias for makemigrations. The update_database command is an alias for migrate and also handles automatic database creation.

---

## Implementation Notes

The project follows a code-first approach where database tables are created automatically from model definitions. Developers do not need to write SQL to set up the schema. All migrations are handled through Django management commands.

The database is created automatically when setup_db.py runs. The same auto-create logic also runs again when python manage.py migrate is called, so the database is always guaranteed to exist before Django applies any migration files.

All batch and script-based migration files have been removed. Only manual Django commands are used to manage migrations. This keeps the process consistent across different operating systems and environments.

The system supports flexible authentication for SQL Server, including SQL Server Authentication and Windows Authentication. It also supports multiple server configurations with automatic fallback. This allows the project to run in different environments without requiring manual database setup or credential changes.

The database name haneuscafedb is used for both MySQL and SQL Server. MySQL on Windows always stores database names in lowercase, so the name is kept in lowercase to match exactly what MySQL stores. SQL Server works with the same lowercase name without any issues.

---

## API Documentation

The interactive API reference is served using Scalar v1 and is available at the following URLs once the server is running.

Primary URL:

```
http://localhost:8000/api/scaler/v1
```

Legacy URL (still works):

```
http://localhost:8000/api/docs/
```

The raw OpenAPI 3.0 schema is available at:

```
http://localhost:8000/api/schema/
```

---

## User Roles

Admin users have full access to the system. They can manage all products, orders, inventory, sales, and user accounts. They can also view dashboard analytics and create or delete both Admin and Staff accounts.

Staff users have limited access. They can view products, manage stock, and access the dashboard. They cannot access user management, sales analytics, or admin-only settings.

Role-based access is enforced on both the frontend and the backend. The frontend reads the user type from local storage after login and shows or hides navigation items accordingly. The backend controllers validate permissions for each request.
