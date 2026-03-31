import logging
import json
from flask import Blueprint, jsonify, request
from models.team import (
    get_all_team_selections, 
    update_team_selection as db_update_team_selection,
    get_saved_squads,
    save_squad as db_save_squad,
    load_squad_data
)

logger = logging.getLogger(__name__)
team_bp = Blueprint("team", __name__)

@team_bp.route("/builder", methods=["GET"])
def get_team_selections():
    """Fetches current team builder selections."""
    try:
        results = get_all_team_selections()
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Error fetching team: {e}")
        return jsonify({"error": "Failed to fetch team selections"}), 500

@team_bp.route("/builder", methods=["POST"])
def update_team_selection():
    """Updates a specific position in the team builder."""
    data = request.json
    pos_id = data.get("position_id")
    player_id = data.get("player_id") # Can be None
    notes = data.get("notes", "")
    rotation_color = data.get("rotation_color")
    rotation_minutes = data.get("rotation_minutes")
    
    if not pos_id:
        return jsonify({"error": "position_id is required"}), 400
        
    try:
        success = db_update_team_selection(
            pos_id, 
            player_id, 
            notes, 
            rotation_color=rotation_color, 
            rotation_minutes=rotation_minutes
        )
        if success:
            return jsonify({"status": "success"}), 200
        else:
            return jsonify({"error": "Position not found"}), 404
    except Exception as e:
        logger.error(f"Error updating team: {e}")
        return jsonify({"error": "Failed to update team selection"}), 500

@team_bp.route("/saved", methods=["GET"])
def list_saved_squads():
    """Returns all saved squads."""
    try:
        squads = get_saved_squads()
        return jsonify(squads), 200
    except Exception as e:
        logger.error(f"Error listing squads: {e}")
        return jsonify({"error": "Failed to list squads"}), 500

@team_bp.route("/saved", methods=["POST"])
def save_current_squad():
    """Saves the current field state as a named squad."""
    data = request.json
    name = data.get("name")
    
    if not name:
        return jsonify({"error": "name is required"}), 400
        
    try:
        # Get current state
        current = get_all_team_selections()
        success = db_save_squad(name, json.dumps(current))
        return jsonify(success), 201
    except Exception as e:
        logger.error(f"Error saving squad: {e}")
        return jsonify({"error": "Failed to save squad"}), 500

@team_bp.route("/saved/<int:squad_id>/load", methods=["POST"])
def load_saved_squad(squad_id):
    """Loads a saved squad into the active team builder."""
    try:
        squad_json = load_squad_data(squad_id)
        if not squad_json:
            return jsonify({"error": "Squad not found"}), 404
            
        squad_data = json.loads(squad_json)
        
        # Overwrite all current positions
        for item in squad_data:
            db_update_team_selection(
                item["position_id"], 
                item.get("player_id"), 
                item.get("notes", ""),
                rotation_color=item.get("rotation_color"),
                rotation_minutes=item.get("rotation_minutes")
            )
            
        return jsonify({"status": "success"}), 200
    except Exception as e:
        logger.error(f"Error loading squad: {e}")
        return jsonify({"error": "Failed to load squad"}), 500
