from flask import Blueprint, jsonify
import psutil

bp = Blueprint("api", __name__, url_prefix="/api")

# 👉 Ahora la raíz del blueprint (/api) devuelve el mensaje
@bp.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Hola desde Flask 👋"})

@bp.route("/stats", methods=["GET"])
@bp.route("/stats/", methods=["GET"])
def stats():
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)

        memory = psutil.virtual_memory()
        memory_percent = memory.percent

        disk = psutil.disk_usage("/")
        disk_percent = disk.percent

        temps = psutil.sensors_temperatures()
        cpu_temp = None
        if temps and "coretemp" in temps:
            cpu_temp = temps["coretemp"][0].current
        elif temps:
            first_key = list(temps.keys())[0]
            cpu_temp = temps[first_key][0].current

        return jsonify({
            "cpu_percent": cpu_percent,
            "cpu_temp": cpu_temp,
            "memory_percent": memory_percent,
            "disk_percent": disk_percent
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

