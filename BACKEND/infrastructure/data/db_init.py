"""
infrastructure/data/db_init.py

Automatic database creation with multi-server / multi-auth fallback.

Connects to the database SERVER (not the target database) and creates
the target database if it does not already exist.  Called automatically
by the custom ``migrate`` management command before migrations run.

Supports:
    - MySQL / MariaDB (XAMPP) via mysqlclient (MySQLdb) or pymysql
    - SQL Server via pyodbc
        Instances: default instance, SQLEXPRESS, LocalDB, any custom instance
        Auth modes: SQL Server Authentication → Windows Authentication (fallback)

Fallback strategy for SQL Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
1. Server specified in DB_HOST (.env).
2. localhost  (default SQL Server instance)
3. .\\SQLEXPRESS
4. (localdb)\\MSSQLLocalDB

For each server candidate, SQL Server Authentication is tried first
(when DB_USER is provided), then Windows Authentication.

Fallback strategy for MySQL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
1. Host specified in DB_HOST (.env)
2. 127.0.0.1
3. localhost

No exceptions propagate — warnings are printed and Django's own
connection error will surface if all attempts fail.
"""

import os
import sys
from typing import Optional, Tuple


# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

# SQL Server instance candidates tried in order when the configured host fails.
_MSSQL_FALLBACK_SERVERS = [
    "localhost",          # default SQL Server instance
    r".\SQLEXPRESS",      # SQL Server Express
    r"(localdb)\MSSQLLocalDB",  # Visual Studio / LocalDB
]

# MySQL host candidates tried in order when the configured host fails.
_MYSQL_FALLBACK_HOSTS = ["127.0.0.1", "localhost"]


# ──────────────────────────────────────────────────────────────────────────────
# Public entry point
# ──────────────────────────────────────────────────────────────────────────────

def ensure_database_exists() -> None:
    """
    Connect to the database server and create the configured database
    if it does not already exist.

    Reads all settings from environment variables, which are populated
    by ``load_dotenv()`` in ``config/settings.py`` before any management
    command's ``handle()`` method is ever called.
    """
    db_engine = os.environ.get("DB_ENGINE", "mysql").lower()
    db_name   = os.environ.get("DB_NAME", "").strip()

    if not db_name:
        _warn("DB_NAME is not set in .env — skipping auto-create.")
        return

    if db_engine == "mssql":
        _ensure_mssql(db_name)
    else:
        _ensure_mysql(db_name)


# ──────────────────────────────────────────────────────────────────────────────
# MySQL / MariaDB (XAMPP)
# ──────────────────────────────────────────────────────────────────────────────

def _ensure_mysql(db_name: str) -> None:
    """Auto-create a MySQL / MariaDB database, trying fallback hosts."""
    db_user     = os.environ.get("DB_USER", "root")
    db_password = os.environ.get("DB_PASSWORD", "")
    db_host     = os.environ.get("DB_HOST", "127.0.0.1")
    db_port     = int(os.environ.get("DB_PORT", "3306"))

    driver = _import_mysql_driver()
    if driver is None:
        return

    # Try the configured host first, then common fallbacks.
    host_candidates = _unique([db_host] + _MYSQL_FALLBACK_HOSTS)

    for host in host_candidates:
        conn = cursor = None
        try:
            conn = driver.connect(
                host=host,
                user=db_user,
                password=db_password,
                port=db_port,
                # No database= so we connect to the server, not a specific DB.
            )
            cursor = conn.cursor()
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
            conn.commit()
            _info(f"MySQL/MariaDB: database '{db_name}' is ready "
                  f"(host: {host}:{db_port}).")
            return  # Success
        except Exception as exc:  # noqa: BLE001
            _debug(f"MySQL host '{host}:{db_port}' failed — {exc}")
        finally:
            _close(cursor, conn)

    _warn(
        f"Could not auto-create MySQL database '{db_name}'.\n"
        f"  Tried hosts : {', '.join(host_candidates)} (port {db_port})\n"
         "  Likely cause: XAMPP MySQL is not running, or credentials in .env are wrong.\n"
         "  Fix         : Start XAMPP → MySQL, then re-run `python manage.py migrate`."
    )


def _import_mysql_driver():
    """Return the first available MySQL driver module, or None."""
    try:
        import MySQLdb  # mysqlclient (preferred — C extension)
        return MySQLdb
    except ImportError:
        pass
    try:
        import pymysql  # pure-Python fallback
        return pymysql
    except ImportError:
        pass
    _warn(
        "No MySQL driver installed.  Install one with:\n"
        "    pip install mysqlclient"
    )
    return None


# ──────────────────────────────────────────────────────────────────────────────
# SQL Server (SSMS 19 / SQLExpress / LocalDB / any instance)
# ──────────────────────────────────────────────────────────────────────────────

def _ensure_mssql(db_name: str) -> None:
    """
    Auto-create a SQL Server database with multi-server + multi-auth fallback.

    Tries each server candidate in order.  For every candidate, SQL Server
    Authentication is attempted first (when DB_USER is provided), then
    Windows Authentication (Trusted_Connection).  The first successful
    connection wins.
    """
    try:
        import pyodbc
    except ImportError:
        _warn(
            "pyodbc is not installed.  Install with:\n"
            "    pip install pyodbc mssql-django"
        )
        return

    db_user     = os.environ.get("DB_USER", "")
    db_password = os.environ.get("DB_PASSWORD", "")
    db_host     = os.environ.get("DB_HOST", "localhost")
    db_port     = os.environ.get("DB_PORT", "1433")
    driver      = os.environ.get("DB_MSSQL_DRIVER", "ODBC Driver 17 for SQL Server")

    # Build the primary server string from the configured host.
    # Named instances (host\INSTANCE) and LocalDB already include the instance;
    # plain hostnames get the port appended.
    if "\\" in db_host or "(" in db_host:
        primary = db_host
    else:
        primary = f"{db_host},{db_port}"

    server_candidates = _unique([primary] + _MSSQL_FALLBACK_SERVERS)

    for server in server_candidates:
        conn, auth_mode = _mssql_connect(
            server, driver, db_user, db_password, pyodbc
        )
        if conn is None:
            _debug(f"SQL Server: no connection on '{server}' (tried SQL + Windows auth).")
            continue

        # Connected — create the database if it is missing.
        cursor = None
        try:
            cursor = conn.cursor()
            cursor.execute(
                "IF NOT EXISTS ("
                f"  SELECT 1 FROM sys.databases WHERE name = N'{db_name}'"
                f") CREATE DATABASE [{db_name}];"
            )
            _info(
                f"SQL Server: database '{db_name}' is ready "
                f"(server: {server}, auth: {auth_mode})."
            )
            return  # Success
        except Exception as exc:  # noqa: BLE001
            _warn(
                f"SQL Server: connected to '{server}' ({auth_mode}) but could not "
                f"create database '{db_name}': {exc}\n"
                 "  Make sure the login has the 'dbcreator' server role."
            )
            return  # Don't try other servers if we connected but creation failed.
        finally:
            _close(cursor, conn)

    _warn(
        f"Could not connect to SQL Server to auto-create database '{db_name}'.\n"
        f"  Tried servers : {', '.join(server_candidates)}\n"
         "  Auth methods  : SQL Server Authentication, Windows Authentication\n"
         "  Likely causes :\n"
         "    - SQL Server service is not running\n"
         "    - TCP/IP disabled (enable in SQL Server Configuration Manager)\n"
         "    - Wrong credentials in .env (DB_USER / DB_PASSWORD)\n"
         "    - ODBC driver not installed (see DB_MSSQL_DRIVER in .env)\n"
         "  Fix: resolve the issue above, then re-run `python manage.py migrate`."
    )


def _mssql_connect(
    server: str,
    driver: str,
    db_user: str,
    db_password: str,
    pyodbc,
) -> Tuple[Optional[object], Optional[str]]:
    """
    Try connecting to a SQL Server instance using two auth strategies:
      A) SQL Server Authentication  (when DB_USER is provided)
      B) Windows Authentication     (Trusted_Connection=yes)

    Returns ``(connection, auth_label)`` on success, or ``(None, None)``.
    """
    base = (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        "Database=master;"
        "TrustServerCertificate=yes;"
        "Login Timeout=5;"
    )

    # ── A: SQL Server Authentication ─────────────────────────────────
    if db_user:
        try:
            conn = pyodbc.connect(
                base + f"UID={db_user};PWD={db_password};",
                autocommit=True,
            )
            return conn, "SQL Server Authentication"
        except Exception as exc:  # noqa: BLE001
            _debug(f"  SQL Auth on '{server}': {exc}")

    # ── B: Windows Authentication (Trusted_Connection) ───────────────
    try:
        conn = pyodbc.connect(
            base + "Trusted_Connection=yes;",
            autocommit=True,
        )
        return conn, "Windows Authentication"
    except Exception as exc:  # noqa: BLE001
        _debug(f"  Windows Auth on '{server}': {exc}")

    return None, None


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _unique(items: list) -> list:
    """Deduplicate a list while preserving insertion order."""
    seen: set = set()
    out: list = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def _close(*objs) -> None:
    """Close database objects silently."""
    for obj in objs:
        if obj is not None:
            try:
                obj.close()
            except Exception:  # noqa: BLE001
                pass


def _info(message: str) -> None:
    print(f"[db_init] {message}", flush=True)


def _debug(message: str) -> None:
    """Print only when DJANGO_DEBUG is truthy."""
    if os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes"):
        print(f"[db_init] DEBUG: {message}", file=sys.stderr, flush=True)


def _warn(message: str) -> None:
    print(f"[db_init] WARNING: {message}", file=sys.stderr, flush=True)
