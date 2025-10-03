from flask import Blueprint, jsonify
import psutil
import subprocess

bp = Blueprint("memory_info", __name__, url_prefix="/memory")

@bp.route("/", methods=["GET"])
def memory_info():
    try:
        # Info básica en vivo con psutil
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

            # Nuevo bloque
            if line.startswith("Memory Device"):
                in_device = True
                current_slot = {}
                continue

            if in_device:
                if ":" in line:
                    key, value = line.split(":", 1)
                    key = key.strip().lower().replace(" ", "_")
                    value = value.strip()
                    current_slot[key] = value

                    # Normalizaciones útiles
                    if key == "size":
                        if "No Module Installed" in value:
                            current_slot["size_gb"] = 0
                            current_slot["status"] = "Empty"
                        else:
                            num = "".join([c for c in value if c.isdigit()])
                            if num:
                                size = int(num)
                                if "MB" in value:
                                    size = round(size / 1024, 2)
                                current_slot["size_gb"] = size
                                current_slot["status"] = "Occupied"

            # Fin de bloque
            if line == "" and in_device:
                if current_slot:
                    slots.append(current_slot)
                current_slot = {}
                in_device = False

        return jsonify({
            "memory_percent": memory.percent,
            "memory_total_gb": total_gb,
            "memory_available_gb": available_gb,
            "total_slots": len(slots),
            "slots": slots
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
