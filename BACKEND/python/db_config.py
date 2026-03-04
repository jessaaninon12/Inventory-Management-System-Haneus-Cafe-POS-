"""
Database Configuration Utility for Haneus Cafe POS.

Run this script to verify your database connection before starting Django:
    python python/db_config.py

It reads the same environment variables used by Django settings
(DB_ENGINE, DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
and attempts a test connection.

Supported engines:
  DB_ENGINE=mysql   -> MySQL via XAMPP  (default)
  DB_ENGINE=mssql   -> Microsoft SQL Server via SSMS
"""

import os
import sys


def get_db_engine():
    """Return the selected database engine from environment."""
    return os.environ.get("DB_ENGINE", "mysql").lower()


def test_mysql_connection():
    """Test MySQL connection (XAMPP)."""
    try:
        import MySQLdb
    except ImportError:
        print("[FAIL] mysqlclient is not installed. Run: pip install mysqlclient")
        return False

    host = os.environ.get("DB_HOST", "127.0.0.1")
    port = int(os.environ.get("DB_PORT", "3306"))
    user = os.environ.get("DB_USER", "root")
    password = os.environ.get("DB_PASSWORD", "")
    db_name = os.environ.get("DB_NAME", "haneus_cafe_db")

    try:
        conn = MySQLdb.connect(
            host=host, port=port, user=user, passwd=password, db=db_name
        )
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION();")
        version = cursor.fetchone()[0]
        conn.close()
        print(f"[OK] MySQL {version} — connected to {db_name}@{host}:{port}")
        return True
    except Exception as e:
        print(f"[FAIL] MySQL connection error: {e}")
        print(f"       Make sure XAMPP MySQL is running and database '{db_name}' exists.")
        return False


def test_mssql_connection():
    """Test Microsoft SQL Server connection (SSMS)."""
    try:
        import pyodbc
    except ImportError:
        print("[FAIL] pyodbc is not installed. Run: pip install pyodbc")
        return False

    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "1433")
    user = os.environ.get("DB_USER", "sa")
    password = os.environ.get("DB_PASSWORD", "")
    db_name = os.environ.get("DB_NAME", "HaneusCafeDB")
    driver = os.environ.get("DB_MSSQL_DRIVER", "ODBC Driver 17 for SQL Server")

    conn_str = (
        f"DRIVER={{{driver}}};"
        f"SERVER={host},{port};"
        f"DATABASE={db_name};"
        f"UID={user};"
        f"PWD={password};"
    )

    try:
        conn = pyodbc.connect(conn_str, timeout=5)
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION;")
        version = cursor.fetchone()[0].split("\n")[0]
        conn.close()
        print(f"[OK] SQL Server — {version}")
        print(f"     Connected to {db_name}@{host}:{port}")
        return True
    except Exception as e:
        print(f"[FAIL] SQL Server connection error: {e}")
        print(f"       Make sure SQL Server is running and '{db_name}' exists in SSMS.")
        return False


def main():
    engine = get_db_engine()
    print(f"Testing database connection (DB_ENGINE={engine})...\n")

    if engine == "mssql":
        success = test_mssql_connection()
    else:
        success = test_mysql_connection()

    print()
    if success:
        print("Database connection verified. You can now run Django:")
        print("  python manage.py migrate")
        print("  python manage.py runserver")
    else:
        print("Fix the issues above, then try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()
