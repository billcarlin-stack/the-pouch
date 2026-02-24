"""
The Shinboner Hub — IDP Ratings API Routes

Endpoints:
    GET /api/idp/<jumper_no>  — IDP ratings for a specific player
"""

import logging

from flask import Blueprint, jsonify

from models.idp_ratings import get_idp_for_player
from auth.middleware import require_role

logger = logging.getLogger(__name__)

idp_bp = Blueprint("idp", __name__)


@idp_bp.route("/api/idp/<int:jumper_no>", methods=["GET"])
@require_role("admin", "coach", "analyst")
def get_idp(jumper_no):
    """
    Returns the Individual Development Plan (IDP) ratings for a player.

    IDP Categories (1-10 scale):
        - Grit
        - TacticalIQ
        - Execution
        - Resilience
        - Leadership
        - composite_score (weighted average)

    Path params:
        jumper_no: Player's jumper number (integer).
    """
    try:
        idp = get_idp_for_player(jumper_no)
        return jsonify(idp), 200

    except Exception as e:
        logger.error("Error fetching IDP for player %d: %s", jumper_no, str(e))
        return (
            jsonify({"error": "Failed to fetch IDP ratings", "detail": str(e)}),
            500,
        )
