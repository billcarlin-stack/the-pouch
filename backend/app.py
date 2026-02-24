"""
The Shinboner Hub — Application Entry Point

Flask application factory for the North Melbourne FC
high-performance analytics platform.

Usage:
    Development:  python app.py
    Production:   gunicorn -c gunicorn.conf.py app:app
"""

import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import get_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def create_app(config=None):
    """
    Application factory for the Shinboner Hub backend.

    Args:
        config: Optional configuration object. If None, auto-detects
                from FLASK_ENV environment variable.

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__)

    # Load configuration
    if config is None:
        config = get_config()
    app.config.from_object(config)

    # Enable CORS
    CORS(app, origins=config.CORS_ORIGINS)

    # ── Health Check ──────────────────────────────────────────────
    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "Shinboner Hub Online",
            "version": "2026.2.0",
            "environment": os.environ.get("FLASK_ENV", "development"),
        }), 200

    # ── Register Blueprints ───────────────────────────────────────
    from routes.players import players_bp
    from routes.idp import idp_bp
    from routes.wellbeing import wellbeing_bp
    from routes.availability import availability_bp
    from routes.insights import insights_bp

    app.register_blueprint(players_bp)
    app.register_blueprint(idp_bp)
    app.register_blueprint(wellbeing_bp)
    app.register_blueprint(availability_bp)
    app.register_blueprint(insights_bp)
    
    from routes.injuries import injuries_bp
    from routes.ratings import ratings_bp
    from routes.ai import ai_bp
    from routes.stats import stats_bp
    from routes.team import team_bp
    from routes.auth import auth_bp
    from routes.woop import woop_bp
    from routes.calendar import calendar_bp

    app.register_blueprint(injuries_bp, url_prefix='/api')
    app.register_blueprint(ratings_bp, url_prefix='/api')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')
    app.register_blueprint(team_bp, url_prefix='/api/team')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(woop_bp, url_prefix='/api')
    app.register_blueprint(calendar_bp, url_prefix='/api')

    # ── Global Error Handlers ─────────────────────────────────────
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource does not exist",
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method Not Allowed",
            "message": "The HTTP method is not allowed for this endpoint",
        }), 405

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
        }), 500

    logger.info("Shinboner Hub backend initialised — %s mode", config.__class__.__name__)

    return app


# Create the app instance (used by Gunicorn: `gunicorn app:app`)
app = create_app()


if __name__ == "__main__":
    # Use PORT from environment (Cloud Run requirement)
    port = int(os.environ.get("PORT", 5000))
    # Disable debug if we have a PORT set (likely production)
    app.run(debug=(port == 5000), host="0.0.0.0", port=port)
