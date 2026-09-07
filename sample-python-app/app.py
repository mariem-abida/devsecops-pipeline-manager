from flask import Flask, jsonify
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__)

csrf = CSRFProtect()
csrf.init_app(app)


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "DevSecOps Sample App is running",
        "version": "1.0.0"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "sample-python-app"
    }), 200


@app.route("/api/users", methods=["GET"])
def get_users():
    users = [
        {"id": 1, "name": "Alice", "role": "admin"},
        {"id": 2, "name": "Bob", "role": "developer"},
        {"id": 3, "name": "Carol", "role": "analyst"},
    ]

    return jsonify({
        "users": users,
        "count": len(users)
    })


@app.route("/api/status", methods=["GET"])
def get_status():
    return jsonify({
        "status": "operational",
        "environment": "test",
        "pipeline": "devsecops"
    })