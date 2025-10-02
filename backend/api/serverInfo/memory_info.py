from flask import Blueprint, jsonify
import psutil
import subprocess
import re

bp = Blueprint("memory_info", __name__, url_prefix="/memory")

@bp.route("/", methods=["GET"])
def memory_info():
    try:
        # Info básica con psutil
        memory = psutil.virtual_memory()
        total_gb = round(memory.total / (1024**3), 2)
        available_gb = round(memory.available / (1024**3), 2)

        # Ejecutar dmidecode para info de módulos
        try:
            output = subprocess.check_output(["sudo", "dmidecode", "-t", "memory"], text=True, stderr=subprocess.DEVNULL)
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
        for line in output.splitlines():
            line = line.strip()
            if line.startswith("Locator:"):
                current_slot["locator"] = line.split(":", 1)[1].strip()
            elif line.startswith("Size:") and "No Module Installed" not in line:
                size_match = re.search(r"(\d+)", line)
                if size_match:
                    current_slot["size_gb"] = int(size_match.group(1)) if "MB" not in line else round(int(size_match.group(1))/1024, 2)
            elif line.startswith("Speed:") and "Unknown" not in line:
                speed_match = re.search(r"(\d+)", line)
                if speed_match:
                    current_slot["speed_mhz"] = int(speed_match.group(1))
            elif line.startswith("Manufacturer:") and "Manufacturer" not in line:
                current_slot["manufacturer"] = line.split(":", 1)[1].strip()
            elif line.startswith("Part Number:") and line.split(":", 1)[1].strip():
                current_slot["part_number"] = line.split(":", 1)[1].strip()

            # Cuando se detecta fin de bloque
            if line == "" and current_slot:
                if "size_gb" in current_slot:  # Solo guardar si hay módulo instalado
                    slots.append(current_slot)
                current_slot = {}

        return jsonify({
            "memory_percent": memory.percent,
            "memory_total_gb": total_gb,
            "memory_available_gb": available_gb,
            "slots": slots
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
