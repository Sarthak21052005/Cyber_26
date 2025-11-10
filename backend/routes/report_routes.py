from flask import Blueprint, request
from models import get_db_connection
from utils.helpers import success_response, error_response
from datetime import datetime, timedelta

report_bp = Blueprint('report', __name__, url_prefix='/api/reports')

# Daily sales report
@report_bp.route('/daily-sales', methods=['GET'])
def get_daily_sales():
    try:
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                COUNT(DISTINCT o.order_id) as total_orders,
                SUM(o.total_amount) as total_revenue,
                AVG(o.total_amount) as avg_order_value,
                COUNT(CASE WHEN o.order_type = 'dine-in' THEN 1 END) as dine_in_orders,
                COUNT(CASE WHEN o.order_type = 'takeaway' THEN 1 END) as takeaway_orders,
                SUM(CASE WHEN o.order_type = 'dine-in' THEN o.total_amount ELSE 0 END) as dine_in_revenue,
                SUM(CASE WHEN o.order_type = 'takeaway' THEN o.total_amount ELSE 0 END) as takeaway_revenue
            FROM Orders o
            WHERE DATE(o.order_date) = %s AND o.order_status = 'completed'
        """, (date,))
        
        sales = cur.fetchone()
        cur.close()
        conn.close()
        
        return success_response(sales)
    except Exception as e:
        return error_response(str(e), 500)

# Popular items
@report_bp.route('/popular-items', methods=['GET'])
def get_popular_items():
    try:
        start_date = request.args.get('start_date', (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'))
        end_date = request.args.get('end_date', datetime.now().strftime('%Y-%m-%d'))
        limit = request.args.get('limit', 10)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                m.menu_id,
                m.item_name,
                m.category,
                m.cuisine,
                m.price,
                COUNT(oi.order_item_id) as times_ordered,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_revenue
            FROM OrderItems oi
            JOIN Menu m ON oi.menu_id = m.menu_id
            JOIN Orders o ON oi.order_id = o.order_id
            WHERE DATE(o.order_date) BETWEEN %s AND %s
              AND o.order_status = 'completed'
            GROUP BY m.menu_id, m.item_name, m.category, m.cuisine, m.price
            ORDER BY total_quantity DESC
            LIMIT %s
        """, (start_date, end_date, limit))
        
        items = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(items)
    except Exception as e:
        return error_response(str(e), 500)

# Revenue by cuisine
@report_bp.route('/revenue-by-cuisine', methods=['GET'])
def get_revenue_by_cuisine():
    try:
        start_date = request.args.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
        end_date = request.args.get('end_date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                m.cuisine,
                COUNT(DISTINCT oi.order_id) as order_count,
                SUM(oi.quantity) as items_sold,
                SUM(oi.subtotal) as total_revenue,
                AVG(oi.subtotal) as avg_item_value
            FROM OrderItems oi
            JOIN Menu m ON oi.menu_id = m.menu_id
            JOIN Orders o ON oi.order_id = o.order_id
            WHERE DATE(o.order_date) BETWEEN %s AND %s
              AND o.order_status = 'completed'
            GROUP BY m.cuisine
            ORDER BY total_revenue DESC
        """, (start_date, end_date))
        
        cuisines = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(cuisines)
    except Exception as e:
        return error_response(str(e), 500)

# Peak hours analysis
@report_bp.route('/peak-hours', methods=['GET'])
def get_peak_hours():
    try:
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as order_count,
                SUM(total_amount) as revenue
            FROM Orders
            WHERE DATE(order_date) = %s AND order_status = 'completed'
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour
        """, (date,))
        
        hours = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(hours)
    except Exception as e:
        return error_response(str(e), 500)

# Payment method breakdown
@report_bp.route('/payment-methods', methods=['GET'])
def get_payment_methods():
    try:
        start_date = request.args.get('start_date', datetime.now().strftime('%Y-%m-%d'))
        end_date = request.args.get('end_date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                payment_method,
                COUNT(*) as transaction_count,
                SUM(total_amount) as total_amount,
                AVG(total_amount) as avg_transaction_value
            FROM Payments
            WHERE DATE(payment_date) BETWEEN %s AND %s
            GROUP BY payment_method
            ORDER BY total_amount DESC
        """, (start_date, end_date))
        
        methods = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(methods)
    except Exception as e:
        return error_response(str(e), 500)

# NEW: Weekly comparison
@report_bp.route('/weekly-comparison', methods=['GET'])
def get_weekly_comparison():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                TO_CHAR(order_date, 'Day') as day_name,
                DATE(order_date) as date,
                COUNT(*) as orders,
                SUM(total_amount) as revenue
            FROM Orders
            WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'
              AND order_status = 'completed'
            GROUP BY DATE(order_date), TO_CHAR(order_date, 'Day')
            ORDER BY DATE(order_date)
        """)
        
        weekly = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(weekly)
    except Exception as e:
        return error_response(str(e), 500)

# NEW: Order status summary
@report_bp.route('/order-status', methods=['GET'])
def get_order_status_summary():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                order_status,
                COUNT(*) as count,
                SUM(total_amount) as total_value
            FROM Orders
            WHERE DATE(order_date) = CURRENT_DATE
            GROUP BY order_status
        """)
        
        status = cur.fetchall()
        cur.close()
        conn.close()
        
        return success_response(status)
    except Exception as e:
        return error_response(str(e), 500)
