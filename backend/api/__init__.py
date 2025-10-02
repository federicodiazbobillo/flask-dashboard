from flask import Blueprint, jsonify
from .serverInfo import bp as server_info_bp

bp = Blueprint("api", __name__, url_prefix="/api")

@bp.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Hola desde Flask 👋"})

# Registrar serverInfo
bp.register_blueprint(server_info_bp)
