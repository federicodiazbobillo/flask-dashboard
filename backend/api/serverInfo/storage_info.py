from flask import Blueprint, jsonify
import psutil

bp = Blueprint("storage_info", __name__, url_prefix="/server-info/storage")

@bp.route("/", methods=["GET"])
def storage_info():
    try:
        disk = psutil.disk_usage("/")
        total_gb = round(disk.total / (1024**3), 2)
        free_gb = round(disk.free / (1024**3), 2)

        return jsonify({
            "disk_percent": disk.percent,
            "disk_total_gb": total_gb,
            "disk_free_gb": free_gb
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
