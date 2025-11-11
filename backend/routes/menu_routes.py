from flask import Blueprint, request
from models import get_db_connection
from utils.helpers import success_response, error_response

menu_bp = Blueprint('menu', __name__, url_prefix='/api/menu')

@menu_bp.route('/', methods=['GET'])
def get_all_menu_items():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cuisine = request.args.get('cuisine')
        category = request.args.get('category')
        available = request.args.get('available')
        
        query = "SELECT * FROM Menu WHERE 1=1"
        params = []
        
        if cuisine:
            query += " AND cuisine = %s"
            params.append(cuisine)
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        if available:
            query += " AND is_available = %s"
            params.append(available == 'true')
        
        query += " ORDER BY cuisine, category"
        cur.execute(query, params)
        items = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return success_response(items)
    except Exception as e:
        return error_response(str(e), 500)

@menu_bp.route('/<int:menu_id>', methods=['GET'])
def get_menu_item(menu_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM Menu WHERE menu_id = %s", (menu_id,))
        item = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if item:
            return success_response(item)
        return error_response('Menu item not found', 404)
    except Exception as e:
        return error_response(str(e), 500)

@menu_bp.route('/', methods=['POST'])
def create_menu_item():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO Menu (item_name, description, category, cuisine, price, preparation_time, is_available)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING menu_id
        """, (
            data['item_name'],
            data.get('description'),
            data['category'],
            data['cuisine'],
            data['price'],
            data.get('preparation_time'),
            data.get('is_available', True)
        ))
        
        menu_id = cur.fetchone()['menu_id']
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response({'menu_id': menu_id}, 'Menu item created', 201)
    except Exception as e:
        return error_response(str(e), 500)

@menu_bp.route('/<int:menu_id>', methods=['PUT'])
def update_menu_item(menu_id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE Menu
            SET item_name = %s, description = %s, category = %s, cuisine = %s,
                price = %s, preparation_time = %s, is_available = %s
            WHERE menu_id = %s
        """, (
            data['item_name'],
            data.get('description'),
            data['category'],
            data['cuisine'],
            data['price'],
            data.get('preparation_time'),
            data.get('is_available', True),
            menu_id
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response(None, 'Menu item updated')
    except Exception as e:
        return error_response(str(e), 500)

@menu_bp.route('/<int:menu_id>/availability', methods=['PATCH'])
def toggle_availability(menu_id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "UPDATE Menu SET is_available = %s WHERE menu_id = %s",
            (data['is_available'], menu_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return success_response(None, 'Availability updated')
    except Exception as e:
        return error_response(str(e), 500)

@menu_bp.route('/<int:menu_id>', methods=['DELETE'])
def delete_menu_item(menu_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM Menu WHERE menu_id = %s", (menu_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return success_response(None, 'Menu item deleted')
    except Exception as e:
        return error_response(str(e), 500)
