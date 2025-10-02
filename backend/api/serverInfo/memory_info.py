from flask import Blueprint, jsonify
import psutil

bp = Blueprint("memory_info", __name__, url_prefix="/memory")

@bp.route("/", methods=["GET"])
def memory_info():
    try:
        memory = psutil.virtual_memory()
        total_gb = round(memory.total / (1024**3), 2)
        available_gb = round(memory.available / (1024**3), 2)

        return jsonify({
            "memory_percent": memory.percent,
            "memory_total_gb": total_gb,
            "memory_available_gb": available_gb
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
