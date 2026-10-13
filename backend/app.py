import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.admin_routes import admin_bp
from routes.payment_routes import payment_bp

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)

# JWT Error handling
@jwt.unauthorized_loader
def unauthorized_callback(callback):
    return jsonify({'error': 'Missing Authorization Header or Token'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(callback):
    return jsonify({'error': 'Invalid Authorization Token'}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Session Token Has Expired. Please Log In Again.'}), 401

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(student_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(payment_bp)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'system': 'StayWise Smart Hostel Booking System API', 'version': '1.0.0'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Seed if empty database
        from seed import seed_database
        from models import User
        if not User.query.first():
            seed_database()

    app.run(host='0.0.0.0', port=5001, debug=True)
