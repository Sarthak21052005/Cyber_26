import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        database="RestaurantManagement",
        user="postgres",
        password="password@123"  # Replace with actual password
    )
    print("✅ Database connection successful!")
    
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print(f"PostgreSQL version: {version[0]}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Database connection failed: {e}")
