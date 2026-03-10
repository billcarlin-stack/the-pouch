"""
The Nest — Admin Routes
CRUD operations for managing access (user_roles).
Protected by @require_role('admin')
"""
from flask import Blueprint, jsonify, request
from auth.middleware import require_role
from db.alloydb_client import get_session
from models.user_roles import UserRole

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/users", methods=["GET"])
@require_role("admin")
def get_all_users():
    session = get_session()
    try:
        users = session.query(UserRole).order_by(UserRole.created_at.desc()).all()
        return jsonify([
            {
                "id": u.id,
                "google_email": u.google_email,
                "role": u.role,
                "player_id": u.player_id,
                "name": u.name,
                "created_at": u.created_at.isoformat() if u.created_at else None
            } for u in users
        ]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@admin_bp.route("/users", methods=["POST"])
@require_role("admin")
def create_user():
    data = request.get_json()
    email = data.get("google_email", "").strip().lower()
    role = data.get("role", "player").strip().lower()
    player_id = data.get("player_id")
    name = data.get("name", "").strip()

    if not email:
        return jsonify({"error": "Google email is required"}), 400

    if role not in ["admin", "coach", "player"]:
        return jsonify({"error": "Invalid role"}), 400

    session = get_session()
    try:
        existing = session.query(UserRole).filter_by(google_email=email).first()
        if existing:
            return jsonify({"error": "User with this email already exists"}), 400

        new_user = UserRole(
            google_email=email,
            role=role,
            player_id=player_id if role == "player" else None,
            name=name
        )
        session.add(new_user)
        session.commit()
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@require_role("admin")
def update_user(user_id):
    data = request.get_json()
    session = get_session()
    try:
        user = session.query(UserRole).get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        if "role" in data:
            role = data["role"].strip().lower()
            if role in ["admin", "coach", "player"]:
                user.role = role
        if "player_id" in data:
            user.player_id = data["player_id"]
        if "name" in data:
            user.name = data["name"].strip()
            
        if user.role != "player":
            user.player_id = None

        session.commit()
        return jsonify({"message": "User updated successfully"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@require_role("admin")
def delete_user(user_id):
    session = get_session()
    try:
        user = session.query(UserRole).get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        session.delete(user)
        session.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
