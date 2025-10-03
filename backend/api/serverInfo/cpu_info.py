from flask import Blueprint, jsonify
import psutil, os
import cpuinfo

bp = Blueprint("cpu_info", __name__, url_prefix="/server-info/cpu")

@bp.route("/", methods=["GET"])
def cpu_info():
    try:
        # Modelo de CPU
        info = cpuinfo.get_cpu_info()
        model = info.get("brand_raw", "Desconocido")

        # Núcleos
        cores_physical = psutil.cpu_count(logical=False) or 0
        cores_logical = psutil.cpu_count(logical=True) or 0

        # Frecuencias
        freq = psutil.cpu_freq()
        freq_current = freq.current if freq else None
        freq_min = freq.min if freq else None
        freq_max = freq.max if freq else None

        # Uso total y por core
        usage_total = psutil.cpu_percent(interval=0.5)
        usage_per_core = psutil.cpu_percent(interval=0.5, percpu=True)

        # Temperaturas (si hay sensores)
        temps = psutil.sensors_temperatures() if hasattr(psutil, "sensors_temperatures") else {}
        cpu_temp = None
        if "coretemp" in temps:
            cpu_temp = temps["coretemp"][0].current
        elif "cpu-thermal" in temps:
            cpu_temp = temps["cpu-thermal"][0].current

        # Load Average (solo Linux/Unix)
        try:
            load_avg = os.getloadavg()
        except (AttributeError, OSError):
            load_avg = None

        return jsonify({
            "model": model,
            "cores_physical": cores_physical,
            "cores_logical": cores_logical,
            "freq_current_mhz": freq_current,
            "freq_min_mhz": freq_min,
            "freq_max_mhz": freq_max,
            "cpu_percent_total": usage_total,
            "cpu_percent_per_core": usage_per_core,
            "temperature_c": cpu_temp,
            "load_avg": load_avg
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
