"""
The Shinboner Hub — Authentication Middleware

Role-based access control decorator (stub implementation).
Designed to be replaced with Firebase Auth / Cloud IAP in production.

Supported roles: admin, coach, medical, analyst

Usage:
    from auth.middleware import require_role

    @app.route('/api/secure')
    @require_role('admin', 'coach')
    def secure_endpoint():
        ...
"""

from functools import wraps

from flask import jsonify, request, g

# Valid roles in the system
VALID_ROLES = {"admin", "coach", "medical", "analyst", "player"}


def require_role(*allowed_roles):
    """
    Decorator that enforces role-based access control.

    Reads the `X-User-Role` header from the request and validates it
    against the allowed roles for the endpoint.

    Args:
        *allowed_roles: One or more role strings that are permitted access.

    Returns:
        - 401 if no role header is provided
        - 403 if the role is not in the allowed list
        - Proceeds to the wrapped function if authorized
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_role = request.headers.get("X-User-Role", "").lower().strip()
            player_id_header = request.headers.get("X-Player-Id", "").strip()

            if not user_role:
                return (
                    jsonify(
                        {
                            "error": "Authentication required",
                            "message": "Missing X-User-Role header",
                        }
                    ),
                    401,
                )

            if user_role not in VALID_ROLES:
                return (
                    jsonify(
                        {
                            "error": "Invalid role",
                            "message": f"Role '{user_role}' is not recognized. "
                            f"Valid roles: {', '.join(sorted(VALID_ROLES))}",
                        }
                    ),
                    403,
                )

            if user_role not in allowed_roles:
                return (
                    jsonify(
                        {
                            "error": "Forbidden",
                            "message": f"Role '{user_role}' does not have access "
                            f"to this resource",
                        }
                    ),
                    403,
                )

            # Store role and player ID in Flask's request-scoped globals
            g.user_role = user_role
            g.player_id = None
            if player_id_header:
                try:
                    g.player_id = int(player_id_header)
                except ValueError:
                    pass

            return f(*args, **kwargs)

        return decorated_function

    return decorator
