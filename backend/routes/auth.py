"""
The Nest — Auth Routes

Provides a token verification endpoint for the frontend.
The frontend sends its Firebase ID Token; this endpoint verifies it,
looks up the user's role from the database, and returns the session profile.
"""

import logging
from flask import Blueprint, jsonify, request, g
from auth.firebase_admin_init import get_firebase_app
from firebase_admin import auth as firebase_auth
from models.user_roles import get_user_by_email

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/verify", methods=["POST"])
def verify_token():
    """
    Accepts a Firebase ID token, verifies it, and returns the user's role.

    Body: { "idToken": "<firebase_id_token>" }
    Returns: { "role": "coach"|"player", "name": "...", "player_id": null|int, "email": "..." }
    """
    data = request.get_json()
    id_token = (data or {}).get("idToken", "").strip()

    if not id_token:
        return jsonify({"error": "idToken is required"}), 400

    try:
        get_firebase_app()
        decoded = firebase_auth.verify_id_token(id_token)
        email = decoded.get("email", "").lower().strip()
        display_name = decoded.get("name", "")

        if not email:
            return jsonify({"error": "Token does not contain an email address."}), 400

        # Look up the user's role in the DB
        user = get_user_by_email(email)

        if not user:
            logger.warning("Unauthorized login attempt from: %s", email)
            return jsonify({
                "error": "Access Denied",
                "message": f"Your account ({email}) is not authorized to access The Nest. Please contact your administrator."
            }), 403

        # Build initials from name
        name = user.get("name") or display_name or email.split("@")[0]
        parts = name.split()
        initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else name[:2].upper()

        return jsonify({
            "role": user["role"],
            "name": name,
            "initials": initials,
            "player_id": user.get("player_id"),
            "jumper_no": user.get("player_id"),   # kept for backwards-compat
            "email": email,
        }), 200

    except firebase_auth.ExpiredIdTokenError:
        return jsonify({"error": "Session expired. Please sign in again."}), 401
    except firebase_auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid token. Please sign in again."}), 401
    except Exception as e:
        logger.error("Token verification failed: %s", str(e))
        return jsonify({"error": "Authentication failed. Please try again."}), 500
