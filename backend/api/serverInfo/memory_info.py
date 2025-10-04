from flask import Blueprint, jsonify
import psutil
import subprocess
import re

bp = Blueprint("memory_info", __name__, url_prefix="/server-info/memory")

@bp.route("/", methods=["GET"])
def memory_info():
    try:
        # Info básica
        memory = psutil.virtual_memory()
        total_gb = round(memory.total / (1024**3), 2)
        available_gb = round(memory.available / (1024**3), 2)

        # Ejecutar dmidecode
        try:
            output = subprocess.check_output(
                ["sudo", "dmidecode", "-t", "memory"],
                text=True,
                stderr=subprocess.DEVNULL
            )
        except Exception as e:
            return jsonify({
                "memory_percent": memory.percent,
                "memory_total_gb": total_gb,
                "memory_available_gb": available_gb,
                "slots": [],
                "warning": f"No se pudo ejecutar dmidecode: {str(e)}"
            })

        slots = []
        current_slot = {}
        in_device = False

        for line in output.splitlines():
            line = line.strip()

            if line.startswith("Memory Device"):
                in_device = True
                current_slot = {}
                continue

            if in_device and ":" in line:
                key, value = line.split(":", 1)
                key = key.strip().lower().replace(" ", "_")
                value = value.strip()
                current_slot[key] = value

                if key == "size" and "no module installed" not in value.lower():
                    num = "".join([c for c in value if c.isdigit()])
                    if num:
                        size = int(num)
                        if "mb" in value.lower():
                            size = round(size / 1024, 2)
                        current_slot["size_gb"] = size
                        current_slot["status"] = "Occupied"

            if (line == "" and in_device) or line == output.splitlines()[-1]:
                if current_slot:
                    locator = (current_slot.get("locator") or "").upper()
                    if locator and "NO DIMM" not in locator and current_slot.get("size_gb", 0) > 0:
                        slots.append(current_slot)
                current_slot = {}
                in_device = False

        # Normalización
        for s in slots:
            s["manufacturer"] = s.get("manufacturer", "N/A")
            s["type"] = s.get("type", "Desconocido")
            s["speed"] = s.get("speed", "Desconocido")

        speeds = []
        types = []
        for s in slots:
            if s.get("speed") and re.search(r"\d+", s["speed"]):
                speeds.append(int(re.search(r"\d+", s["speed"]).group()))
            if s.get("type") and "DDR" in s["type"]:
                types.append(s["type"])

        avg_speed = round(sum(speeds) / len(speeds), 0) if speeds else None
        mem_type = max(set(types), key=types.count) if types else "Desconocido"

        return jsonify({
            "memory_percent": memory.percent,
            "memory_total_gb": total_gb,
            "memory_available_gb": available_gb,
            "memory_type": mem_type,
            "memory_speed_mts": avg_speed,
            "total_slots_detected": len(slots),
            "slots": slots
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
