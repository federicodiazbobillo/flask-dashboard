from flask import Blueprint, jsonify
import psutil
import platform

try:
    import cpuinfo
except ImportError:
    cpuinfo = None

bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Hola desde Flask 👋"})


@bp.route("/stats", methods=["GET"])
def stats():
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)
        cpu_model = None
        if cpuinfo:
            cpu_model = cpuinfo.get_cpu_info().get("brand_raw", None)
        if not cpu_model:
            cpu_model = platform.processor() or "Unknown CPU"

        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_total_gb = round(memory.total / (1024**3), 2)

        disk = psutil.disk_usage("/")
        disk_percent = disk.percent
        disk_total_gb = round(disk.total / (1024**3), 2)

        temps = psutil.sensors_temperatures()
        cpu_temp = None
        if temps:
            if "coretemp" in temps:
                cpu_temp = temps["coretemp"][0].current
            else:
                first_key = list(temps.keys())[0]
                cpu_temp = temps[first_key][0].current

        return jsonify({
            "cpu_model": cpu_model,
            "cpu_percent": cpu_percent,
            "cpu_temp": cpu_temp,
            "memory_percent": memory_percent,
            "memory_total_gb": memory_total_gb,
            "disk_percent": disk_percent,
            "disk_total_gb": disk_total_gb,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
