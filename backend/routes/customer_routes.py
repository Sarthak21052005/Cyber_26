from flask import Blueprint, request
from models import get_db_connection
from utils.helpers import success_response, error_response

customer_bp = Blueprint('customer', __name__, url_prefix='/api/customers')

# GET all customers
@customer_bp.route('/', methods=['GET'])
def get_all_customers():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        customer_type = request.args.get('customer_type')
        search = request.args.get('search')
        
        query = "SELECT * FROM Customers WHERE 1=1"
        params = []
        
        if customer_type:
            query += " AND customer_type = %s"
            params.append(customer_type)
        
        if search:
            query += " AND (name ILIKE %s OR phone ILIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
        
        query += " ORDER BY created_at DESC"
        
        cur.execute(query, params)
        customers = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(customers)
    except Exception as e:
        return error_response(str(e), 500)

# GET single customer
@customer_bp.route('/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM Customers WHERE customer_id = %s", (customer_id,))
        customer = cur.fetchone()
        cur.close()
        conn.close()
        
        if customer:
            return success_response(customer)
        return error_response('Customer not found', 404)
    except Exception as e:
        return error_response(str(e), 500)

# CREATE customer
@customer_bp.route('/', methods=['POST'])
def create_customer():
    try:
        data = request.get_json()
        
        if 'name' not in data or 'phone' not in data:
            return error_response('Name and phone are required', 400)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO Customers (name, phone, email, customer_type)
            VALUES (%s, %s, %s, %s)
            RETURNING customer_id
        """, (
            data['name'],
            data['phone'],
            data.get('email'),
            data.get('customer_type', 'regular')
        ))
        
        customer_id = cur.fetchone()['customer_id']
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response({'customer_id': customer_id}, 'Customer created successfully', 201)
    except Exception as e:
        if 'unique constraint' in str(e).lower():
            return error_response('Phone number already exists', 400)
        return error_response(str(e), 500)

# UPDATE customer
@customer_bp.route('/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE Customers 
            SET name = %s, phone = %s, email = %s, customer_type = %s
            WHERE customer_id = %s
        """, (
            data['name'],
            data['phone'],
            data.get('email'),
            data.get('customer_type', 'regular'),
            customer_id
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response(None, 'Customer updated successfully')
    except Exception as e:
        return error_response(str(e), 500)

# DELETE customer
@customer_bp.route('/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM Customers WHERE customer_id = %s", (customer_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response(None, 'Customer deleted successfully')
    except Exception as e:
        return error_response(str(e), 500)

# NEW: Get customer by phone
@customer_bp.route('/phone/<phone>', methods=['GET'])
def get_customer_by_phone(phone):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM Customers WHERE phone = %s", (phone,))
        customer = cur.fetchone()
        cur.close()
        conn.close()
        
        if customer:
            return success_response(customer)
        return error_response('Customer not found', 404)
    except Exception as e:
        return error_response(str(e), 500)

# NEW: Get customer order history
@customer_bp.route('/<int:customer_id>/orders', methods=['GET'])
def get_customer_orders(customer_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT o.order_id, o.order_token, o.order_type, o.order_status,
                   o.total_amount, o.order_date, o.created_at
            FROM Orders o
            WHERE o.customer_id = %s
            ORDER BY o.created_at DESC
            LIMIT 20
        """, (customer_id,))
        
        orders = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(orders)
    except Exception as e:
        return error_response(str(e), 500)

# NEW: Customer stats
@customer_bp.route('/<int:customer_id>/stats', methods=['GET'])
def get_customer_stats(customer_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_spent,
                AVG(total_amount) as avg_order_value,
                MAX(created_at) as last_order_date
            FROM Orders
            WHERE customer_id = %s AND order_status = 'completed'
        """, (customer_id,))
        
        stats = cur.fetchone()
        cur.close()
        conn.close()
        
        return success_response(stats)
    except Exception as e:
        return error_response(str(e), 500)
