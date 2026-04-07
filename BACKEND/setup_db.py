#!/usr/bin/env python
"""
Database Setup Script for Haneus Cafe POS.

Run this ONCE before starting Django to choose your database
and generate the .env file automatically.

Usage:
    python setup_db.py
"""

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

BANNER = """
╔══════════════════════════════════════════════════════╗
║       Haneus Cafe POS — Database Setup               ║
╚══════════════════════════════════════════════════════╝
"""

MENU = """
Select your database engine:

  [A] MySQL / MariaDB  (via XAMPP)
  [B] SQL Server       (via SSMS 19)
  [C] PostgreSQL       (via pgAdmin / psql)

"""


def prompt(text, default=""):
    """Prompt the user for input with an optional default value."""
    if default:
        result = input(f"  {text} [{default}]: ").strip()
        return result if result else default
    return input(f"  {text}: ").strip()


def setup_mysql():
    """Collect MySQL connection details and return env lines."""
    print("\n── MySQL / MariaDB (XAMPP) ──────────────────────────")
    print("  Make sure XAMPP MySQL is running.")
    print("  The database will be created automatically if it does not exist.")
    print("  Default: root user, no password, port 3306.")
    print("  Note: MySQL always stores database names in lowercase.\n")

    db_name = prompt("Database name", "haneuscafedb").lower()
    db_user = prompt("Username", "root")
    db_pass = prompt("Password (leave blank for none)", "")
    db_host = prompt("Host", "127.0.0.1")
    db_port = prompt("Port", "3306")

    return {
        "DB_ENGINE": "mysql",
        "DB_NAME": db_name,
        "DB_USER": db_user,
        "DB_PASSWORD": db_pass,
        "DB_HOST": db_host,
        "DB_PORT": db_port,
    }


def setup_mssql():
    """Collect SQL Server connection details and return env lines."""
    print("\n── SQL Server (SSMS 19) ────────────────────────────")
    print("  Make sure SQL Server is running.")
    print("  The database will be created automatically if it does not exist.")
    print("  For named instances use: localhost\\SQLEXPRESS")
    print("  For Windows Authentication, leave Username blank and set Windows Auth=True.\n")

    db_name   = prompt("Database name", "haneuscafedb").lower()
    db_host   = prompt("Host (e.g. localhost or localhost\\SQLEXPRESS)", "localhost")
    db_port   = prompt("Port", "1433")
    db_driver = prompt("ODBC Driver", "ODBC Driver 17 for SQL Server")

    win_auth  = input("  Use Windows Authentication? (y/N): ").strip().lower() == "y"

    if win_auth:
        db_user = ""
        db_pass = ""
        db_windows_auth = "True"
    else:
        db_user = prompt("Username (leave blank for Windows Auth)", "")
        db_pass = prompt("Password (leave blank if none)", "")
        db_windows_auth = "False"

    config = {
        "DB_ENGINE": "mssql",
        "DB_NAME": db_name,
        "DB_USER": db_user,
        "DB_PASSWORD": db_pass,
        "DB_HOST": db_host,
        "DB_PORT": db_port,
        "DB_MSSQL_DRIVER": db_driver,
        "DB_WINDOWS_AUTH": db_windows_auth,
    }
    return config


def setup_postgresql():
    """Collect PostgreSQL connection details and return env lines."""
    print("\n── PostgreSQL (pgAdmin / psql) ─────────────────────")
    print("  Make sure PostgreSQL server is running.")
    print("  The database will be created automatically if it does not exist.")
    print("  Default: postgres user, port 5432.\n")

    db_name = prompt("Database name", "haneuscafedb").lower()
    db_host = prompt("Host (e.g. localhost)", "localhost")
    db_port = prompt("Port", "5432")
    db_user = prompt("Username", "postgres")
    db_pass = prompt("Password (leave blank if none)", "")

    return {
        "DB_ENGINE": "postgresql",
        "DB_NAME": db_name,
        "DB_USER": db_user,
        "DB_PASSWORD": db_pass,
        "DB_HOST": db_host,
        "DB_PORT": db_port,
    }


def write_env(config):
    """Write the .env file from config dict."""
    lines = [
        "# ── Django ──────────────────────────────────────────",
        "DJANGO_SECRET_KEY=change-this-in-production",
        "DJANGO_DEBUG=True",
        "DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1",
        "",
        f"# ── Database ({config['DB_ENGINE']}) ─────────────────────────────",
    ]

    for key, value in config.items():
        lines.append(f"{key}={value}")

    lines.append("")
    lines.append("# ── Frontend (for reference) ────────────────────────")
    lines.append("API_BASE_URL=http://localhost:8000")
    lines.append("")

    ENV_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n  .env file created at: {ENV_FILE}")


def create_database_now(config):
    """
    Create the database immediately after writing .env.

    Injects the collected config into os.environ so that
    ensure_database_exists() can read it without needing Django
    to be fully initialised.
    """
    for key, value in config.items():
        os.environ[key] = str(value)

    # BACKEND directory must be on sys.path for the import to work.
    backend_dir = str(BASE_DIR)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    print("\n  Creating database if it does not exist...")
    try:
        from infrastructure.data.db_init import ensure_database_exists
        ensure_database_exists()
    except ImportError as exc:
        print(f"  [warning] Could not import db_init: {exc}")
        print("  The database will be created when you run: python manage.py migrate")


def print_next_steps(engine):
    """Show the user what to do next."""
    print("\n── Next Steps ──────────────────────────────────────\n")

    if engine == "mysql":
        print("  1. Make sure XAMPP Apache + MySQL are running.")
        print("  2. Install the MySQL driver:")
        print("       pip install mysqlclient")
        print("  3. Run migrations (the database is created automatically):")
    elif engine == "mssql":
        print("  1. Make sure SQL Server is running (check SSMS).")
        print("  2. Install the SQL Server driver:")
        print("       pip install mssql-django pyodbc")
        print("  3. Run migrations (the database is created automatically):")
    elif engine == "postgresql":
        print("  1. Make sure PostgreSQL server is running (check pgAdmin or psql).")
        print("  2. Install the PostgreSQL driver:")
        print("       pip install psycopg2-binary")
        print("  3. Run migrations (the database is created automatically):")

    print()
    print("  Standard Django commands:")
    print("    python manage.py makemigrations api")
    print("    python manage.py makemigrations infrastructure")
    print("    python manage.py migrate")
    print()
    print("  EF-style aliases (same behavior):")
    print("    python manage.py add_migration api")
    print("    python manage.py add_migration infrastructure")
    print("    python manage.py update_database")
    print()
    print("  For superadmin user, use this command:")
    print("    python manage.py createsuperuser_custom")
    print()
    print("  Then start the server:")
    print("    python manage.py runserver 8000")
    print()
    print("  API docs will be available at:")
    print("    http://localhost:8000/api/docs/")
    print()


def main():
    print(BANNER)

    if ENV_FILE.exists():
        overwrite = input("  .env already exists. Overwrite? (y/N): ").strip().lower()
        if overwrite != "y":
            print("  Aborted. Existing .env kept.")
            sys.exit(0)

    print(MENU)
    choice = input("  Your choice (A/B/C): ").strip().upper()

    if choice == "A":
        config = setup_mysql()
    elif choice == "B":
        config = setup_mssql()
    elif choice == "C":
        config = setup_postgresql()
    else:
        print(f"  Invalid choice: {choice}")
        sys.exit(1)

    write_env(config)
    create_database_now(config)
    print_next_steps(config["DB_ENGINE"])


if __name__ == "__main__":
    main()
