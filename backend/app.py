from flask import Flask, jsonify
from flask_cors import CORS
from models import test_connection
from routes.menu_routes import menu_bp
from routes.customer_routes import customer_bp
from routes.order_routes import order_bp
from routes.payment_routes import payment_bp
from routes.report_routes import report_bp

app = Flask(__name__)

# ==========================================
# CORS CONFIGURATION - FIXED
# ==========================================
CORS(app, 
     origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     supports_credentials=True,
     expose_headers=["Content-Type", "Authorization"],
     max_age=3600
)

# Disable trailing slash redirects (THIS IS THE KEY FIX!)
app.url_map.strict_slashes = False

# Register blueprints
app.register_blueprint(menu_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(order_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(report_bp)

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'Restaurant Management System API',
        'version': '1.0.0'
    })

@app.route('/api/test-connection')
def test_db_connection():
    success, result = test_connection()
    if success:
        return jsonify({
            'status': 'success',
            'message': 'Database connected successfully',
            'version': result
        })
    else:
        return jsonify({
            'status': 'error',
            'message': 'Database connection failed',
            'error': result
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error',
        'error': str(error)
    }), 500

# Add explicit OPTIONS handler
@app.before_request
def handle_preflight():
    from flask import request
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting Restaurant Management System API...")
    print("=" * 50)
    
    success, result = test_connection()
    if success:
        print(f"✅ Database connected successfully!")
        print(f"   Version: {result[:50]}...")
    else:
        print(f"❌ Database connection failed: {result}")
        print("⚠️  Please check your .env configuration")
    
    print("=" * 50)
    print("📍 API Endpoints:")
    print("   • http://127.0.0.1:5000 (Home)")
    print("   • http://127.0.0.1:5000/api/test-connection")
    print("   • http://127.0.0.1:5000/api/menu")
    print("   • http://127.0.0.1:5000/api/orders")
    print("   • http://127.0.0.1:5000/api/customers")
    print("   • http://127.0.0.1:5000/api/payments")
    print("=" * 50)
    print("🌐 CORS enabled for: http://localhost:5173")
    print("=" * 50)
    
    app.run(debug=True, port=5000, host='0.0.0.0')
