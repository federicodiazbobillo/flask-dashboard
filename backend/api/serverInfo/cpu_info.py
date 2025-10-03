from flask import Blueprint, jsonify
import psutil
import cpuinfo

bp = Blueprint("cpu_info", __name__, url_prefix="/server-info/cpu")

@bp.route("/", methods=["GET"])
def cpu_info():
    try:
        # Modelo CPU
        cpu_model = cpuinfo.get_cpu_info().get("brand_raw", "Unknown CPU")

        # Uso CPU
        cpu_percent = psutil.cpu_percent(interval=0.5)

        # Temperatura CPU
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
            "cpu_temp": cpu_temp
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
