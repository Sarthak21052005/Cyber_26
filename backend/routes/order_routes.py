from flask import Blueprint, request
from models import get_db_connection
from utils.helpers import success_response, error_response
from datetime import datetime
import random

order_bp = Blueprint('order', __name__, url_prefix='/api/orders')

def generate_order_token(order_type, table_number=None):
    """Generate order token: T-001 for takeaway, D5-01 for dine-in table 5"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if order_type == 'takeaway':
            cur.execute("""
                SELECT order_token FROM Orders 
                WHERE order_token LIKE 'T-%%' AND order_date = CURRENT_DATE 
                ORDER BY order_id DESC LIMIT 1
            """)
            last_order = cur.fetchone()
            
            if last_order and last_order['order_token']:
                last_num = int(last_order['order_token'].split('-')[1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            token = f"T-{new_num:03d}"
        else:
            cur.execute("""
                SELECT order_token FROM Orders 
                WHERE order_token LIKE %s AND order_date = CURRENT_DATE 
                ORDER BY order_id DESC LIMIT 1
            """, (f"D{table_number}-%",))
            last_order = cur.fetchone()
            
            if last_order and last_order['order_token']:
                last_num = int(last_order['order_token'].split('-')[1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            token = f"D{table_number}-{new_num:02d}"
        
        cur.close()
        conn.close()
        return token
    except Exception as e:
        print(f"Error generating token: {e}")
        return f"ORD-{random.randint(1000, 9999)}"

@order_bp.route('/', methods=['GET'])
@order_bp.route('', methods=['GET'])
def get_all_orders():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        status = request.args.get('status')
        order_type = request.args.get('order_type')
        order_date = request.args.get('date')
        
        query = """
            SELECT o.*, c.name as customer_name, c.phone as customer_phone
            FROM Orders o
            LEFT JOIN Customers c ON o.customer_id = c.customer_id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND o.order_status = %s"
            params.append(status)
        if order_type:
            query += " AND o.order_type = %s"
            params.append(order_type)
        if order_date:
            query += " AND o.order_date = %s"
            params.append(order_date)
        
        query += " ORDER BY o.created_at DESC"
        
        cur.execute(query, params)
        orders = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(orders)
    except Exception as e:
        print(f"Error fetching orders: {e}")
        return error_response(str(e), 500)

@order_bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT o.*, c.name as customer_name, c.phone as customer_phone
            FROM Orders o
            LEFT JOIN Customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = %s
        """, (order_id,))
        
        order = cur.fetchone()
        
        if not order:
            cur.close()
            conn.close()
            return error_response('Order not found', 404)
        
        cur.execute("""
            SELECT oi.*, m.item_name, m.price as current_price
            FROM OrderItems oi
            JOIN Menu m ON oi.menu_id = m.menu_id
            WHERE oi.order_id = %s
        """, (order_id,))
        
        items = cur.fetchall()
        order['items'] = items
        
        cur.close()
        conn.close()
        
        return success_response(order)
    except Exception as e:
        print(f"Error fetching order {order_id}: {e}")
        return error_response(str(e), 500)

@order_bp.route('/', methods=['POST'])
@order_bp.route('', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        print(f"📥 Received order data: {data}")
        
        # Validate required fields
        if not data.get('customer'):
            return error_response('Customer information is required', 400)
        
        if not data['customer'].get('name') or not data['customer'].get('phone'):
            return error_response('Customer name and phone are required', 400)
        
        if not data.get('order_type'):
            return error_response('Order type is required', 400)
        
        if data['order_type'] == 'dine-in' and not data.get('table_number'):
            return error_response('Table number is required for dine-in orders', 400)
        
        if not data.get('items') or len(data['items']) == 0:
            return error_response('Order must contain at least one item', 400)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Step 1: Create or get customer
        cur.execute("""
            SELECT customer_id FROM Customers WHERE phone = %s
        """, (data['customer']['phone'],))
        
        existing_customer = cur.fetchone()
        
        if existing_customer:
            customer_id = existing_customer['customer_id']
            print(f"✅ Found existing customer: {customer_id}")
        else:
            cur.execute("""
                INSERT INTO Customers (name, phone, email)
                VALUES (%s, %s, %s)
                RETURNING customer_id
            """, (
                data['customer']['name'],
                data['customer']['phone'],
                data['customer'].get('email')
            ))
            customer_id = cur.fetchone()['customer_id']
            print(f"✅ Created new customer: {customer_id}")
        
        # Step 2: Calculate order totals
        subtotal = 0
        for item in data['items']:
            cur.execute("SELECT price FROM Menu WHERE menu_id = %s", (item['menu_id'],))
            menu_item = cur.fetchone()
            if not menu_item:
                cur.close()
                conn.close()
                return error_response(f"Menu item {item['menu_id']} not found", 404)
            
            item_subtotal = float(menu_item['price']) * item['quantity']
            subtotal += item_subtotal
        
        gst_amount = subtotal * 0.05  # 5% GST
        service_charge = subtotal * 0.10 if data['order_type'] == 'dine-in' else 0
        total_amount = subtotal + gst_amount + service_charge
        
        print(f"💰 Calculated totals - Subtotal: {subtotal}, GST: {gst_amount}, Service: {service_charge}, Total: {total_amount}")
        
        # Step 3: Generate order token
        order_token = generate_order_token(
            data['order_type'],
            data.get('table_number')
        )
        print(f"🎫 Generated token: {order_token}")
        
        # Step 4: Create order
        cur.execute("""
            INSERT INTO Orders (
                order_token, customer_id, order_type, table_number,
                order_status, special_instructions, subtotal, gst_amount,
                service_charge, total_amount, order_date
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE)
            RETURNING order_id
        """, (
            order_token,
            customer_id,
            data['order_type'],
            data.get('table_number'),
            'pending',
            data.get('special_instructions'),
            subtotal,
            gst_amount,
            service_charge,
            total_amount
        ))
        
        order_id = cur.fetchone()['order_id']
        print(f"✅ Created order: {order_id}")
        
        # Step 5: Insert order items
        for item in data['items']:
            cur.execute("SELECT price FROM Menu WHERE menu_id = %s", (item['menu_id'],))
            menu_item = cur.fetchone()
            unit_price = float(menu_item['price'])
            item_subtotal = unit_price * item['quantity']
            
            cur.execute("""
                INSERT INTO OrderItems (
                    order_id, menu_id, quantity, unit_price,
                    subtotal, customization, item_status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                order_id,
                item['menu_id'],
                item['quantity'],
                unit_price,
                item_subtotal,
                item.get('customization'),
                'pending'
            ))
        
        print(f"✅ Added {len(data['items'])} items to order")
        
        # Step 6: Update table status if dine-in
        if data['order_type'] == 'dine-in':
            cur.execute("""
                UPDATE RestaurantTables
                SET status = 'occupied'
                WHERE table_number = %s
            """, (data['table_number'],))
            print(f"✅ Updated table {data['table_number']} status to occupied")
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"✅ Order {order_token} created successfully!")
        
        return success_response({
            'order_id': order_id,
            'order_token': order_token,
            'total_amount': float(total_amount)
        }, 'Order created successfully', 201)
        
    except Exception as e:
        print(f"❌ Error creating order: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f"Failed to create order: {str(e)}", 500)

@order_bp.route('/<int:order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    try:
        data = request.get_json()
        
        if not data.get('order_status'):
            return error_response('order_status is required', 400)
        
        valid_statuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled']
        if data['order_status'] not in valid_statuses:
            return error_response(f'Invalid status. Must be one of: {valid_statuses}', 400)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE Orders
            SET order_status = %s
            WHERE order_id = %s
            RETURNING order_id
        """, (data['order_status'], order_id))
        
        result = cur.fetchone()
        
        if not result:
            cur.close()
            conn.close()
            return error_response('Order not found', 404)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response(None, 'Order status updated successfully')
    except Exception as e:
        print(f"Error updating order status: {e}")
        return error_response(str(e), 500)

@order_bp.route('/active', methods=['GET'])
def get_active_orders():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT o.*, c.name as customer_name, c.phone as customer_phone
            FROM Orders o
            LEFT JOIN Customers c ON o.customer_id = c.customer_id
            WHERE o.order_status IN ('pending', 'preparing', 'ready')
            ORDER BY o.created_at ASC
        """)
        
        orders = cur.fetchall()
        
        for order in orders:
            cur.execute("""
                SELECT oi.*, m.item_name
                FROM OrderItems oi
                JOIN Menu m ON oi.menu_id = m.menu_id
                WHERE oi.order_id = %s
            """, (order['order_id'],))
            order['items'] = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return success_response(orders)
    except Exception as e:
        print(f"Error fetching active orders: {e}")
        return error_response(str(e), 500)

@order_bp.route('/<int:order_id>', methods=['DELETE'])
def cancel_order(order_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE Orders
            SET order_status = 'cancelled'
            WHERE order_id = %s
            RETURNING order_id, table_number, order_type
        """, (order_id,))
        
        result = cur.fetchone()
        
        if not result:
            cur.close()
            conn.close()
            return error_response('Order not found', 404)
        
        if result['order_type'] == 'dine-in' and result['table_number']:
            cur.execute("""
                UPDATE RestaurantTables
                SET status = 'available'
                WHERE table_number = %s
            """, (result['table_number'],))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response(None, 'Order cancelled successfully')
    except Exception as e:
        print(f"Error cancelling order: {e}")
        return error_response(str(e), 500)
