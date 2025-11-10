import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config

def get_db_connection():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise e

def test_connection():
    """Test database connection"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT version()')
        version = cur.fetchone()
        cur.close()
        conn.close()
        return True, version['version']
    except Exception as e:
        return False, str(e)
