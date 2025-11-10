from flask import Blueprint, request
from models import get_db_connection
from utils.helpers import success_response, error_response
from datetime import datetime

payment_bp = Blueprint('payment', __name__, url_prefix='/api/payments')

# GET all payments
@payment_bp.route('/', methods=['GET'])
def get_all_payments():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        date = request.args.get('date')
        payment_method = request.args.get('payment_method')
        
        query = """
            SELECT p.*, o.order_token, c.name as customer_name
            FROM Payments p
            JOIN Orders o ON p.order_id = o.order_id
            LEFT JOIN Customers c ON o.customer_id = c.customer_id
            WHERE 1=1
        """
        params = []
        
        if date:
            query += " AND DATE(p.payment_date) = %s"
            params.append(date)
        
        if payment_method:
            query += " AND p.payment_method = %s"
            params.append(payment_method)
        
        query += " ORDER BY p.payment_date DESC"
        
        cur.execute(query, params)
        payments = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(payments)
    except Exception as e:
        return error_response(str(e), 500)

# GET single payment
@payment_bp.route('/<int:payment_id>', methods=['GET'])
def get_payment(payment_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT p.*, o.order_token, c.name as customer_name, c.phone as customer_phone
            FROM Payments p
            JOIN Orders o ON p.order_id = o.order_id
            LEFT JOIN Customers c ON o.customer_id = c.customer_id
            WHERE p.payment_id = %s
        """, (payment_id,))
        
        payment = cur.fetchone()
        cur.close()
        conn.close()
        
        if payment:
            return success_response(payment)
        return error_response('Payment not found', 404)
    except Exception as e:
        return error_response(str(e), 500)

# GET payment by order
@payment_bp.route('/order/<int:order_id>', methods=['GET'])
def get_payment_by_order(order_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT p.*, o.order_token
            FROM Payments p
            JOIN Orders o ON p.order_id = o.order_id
            WHERE p.order_id = %s
        """, (order_id,))
        
        payment = cur.fetchone()
        cur.close()
        conn.close()
        
        if payment:
            return success_response(payment)
        return error_response('Payment not found for this order', 404)
    except Exception as e:
        return error_response(str(e), 500)

# CREATE payment (Process bill)
@payment_bp.route('/', methods=['POST'])
def create_payment():
    try:
        data = request.get_json()
        
        if 'order_id' not in data or 'payment_method' not in data:
            return error_response('order_id and payment_method are required', 400)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get order details
        cur.execute("""
            SELECT subtotal, gst_amount, service_charge, total_amount, order_status
            FROM Orders
            WHERE order_id = %s
        """, (data['order_id'],))
        
        order = cur.fetchone()
        
        if not order:
            cur.close()
            conn.close()
            return error_response('Order not found', 404)
        
        if order['order_status'] == 'cancelled':
            cur.close()
            conn.close()
            return error_response('Cannot process payment for cancelled order', 400)
        
        # Check if payment already exists
        cur.execute("SELECT payment_id FROM Payments WHERE order_id = %s", (data['order_id'],))
        existing_payment = cur.fetchone()
        
        if existing_payment:
            cur.close()
            conn.close()
            return error_response('Payment already processed for this order', 400)
        
        # Calculate change if cash payment
        amount_received = data.get('amount_received', order['total_amount'])
        change_returned = 0
        
        if data['payment_method'] == 'cash' and amount_received > order['total_amount']:
            change_returned = amount_received - order['total_amount']
        
        # Insert payment
        cur.execute("""
            INSERT INTO Payments (order_id, subtotal, gst_amount, service_charge, 
                                 total_amount, payment_method, amount_received, change_returned)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING payment_id
        """, (
            data['order_id'],
            order['subtotal'],
            order['gst_amount'],
            order['service_charge'],
            order['total_amount'],
            data['payment_method'],
            amount_received,
            change_returned
        ))
        
        payment_id = cur.fetchone()['payment_id']
        
        # Update order status to completed
        cur.execute("""
            UPDATE Orders 
            SET order_status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE order_id = %s
        """, (data['order_id'],))
        
        # Update customer stats
        cur.execute("""
            UPDATE Customers
            SET total_orders = total_orders + 1,
                total_spent = total_spent + %s
            WHERE customer_id = (SELECT customer_id FROM Orders WHERE order_id = %s)
        """, (order['total_amount'], data['order_id']))
        
        # Free up table if dine-in
        cur.execute("""
            UPDATE RestaurantTables
            SET status = 'available'
            WHERE table_number = (
                SELECT table_number FROM Orders 
                WHERE order_id = %s AND order_type = 'dine-in'
            )
        """, (data['order_id'],))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response({
            'payment_id': payment_id,
            'change_returned': float(change_returned)
        }, 'Payment processed successfully', 201)
    except Exception as e:
        return error_response(str(e), 500)

# NEW: Generate bill preview (without processing payment)
@payment_bp.route('/bill/<int:order_id>', methods=['GET'])
def generate_bill(order_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get order details
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
        
        # Get order items
        cur.execute("""
            SELECT oi.quantity, oi.unit_price, oi.subtotal, oi.customization,
                   m.item_name, m.category
            FROM OrderItems oi
            JOIN Menu m ON oi.menu_id = m.menu_id
            WHERE oi.order_id = %s
        """, (order_id,))
        
        items = cur.fetchall()
        cur.close()
        conn.close()
        
        bill = {
            'order_id': order['order_id'],
            'order_token': order['order_token'],
            'order_type': order['order_type'],
            'table_number': order['table_number'],
            'customer_name': order['customer_name'],
            'customer_phone': order['customer_phone'],
            'items': items,
            'subtotal': float(order['subtotal']),
            'gst_amount': float(order['gst_amount']),
            'gst_percentage': 5,
            'service_charge': float(order['service_charge']),
            'service_charge_percentage': 10 if order['order_type'] == 'dine-in' else 0,
            'total_amount': float(order['total_amount']),
            'order_date': order['created_at'].strftime('%Y-%m-%d %H:%M:%S') if order['created_at'] else None
        }
        
        return success_response(bill)
    except Exception as e:
        return error_response(str(e), 500)

# NEW: Today's payment summary
@payment_bp.route('/summary/today', methods=['GET'])
def get_today_summary():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_transactions,
                SUM(total_amount) as total_revenue,
                SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_total,
                SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as card_total,
                SUM(CASE WHEN payment_method = 'upi' THEN total_amount ELSE 0 END) as upi_total
            FROM Payments
            WHERE DATE(payment_date) = CURRENT_DATE
        """)
        
        summary = cur.fetchone()
        cur.close()
        conn.close()
        
        return success_response(summary)
    except Exception as e:
        return error_response(str(e), 500)
