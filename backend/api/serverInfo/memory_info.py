from flask import Blueprint, jsonify
import psutil
import subprocess
import re

bp = Blueprint("memory_info", __name__, url_prefix="/server-info/memory")

@bp.route("/", methods=["GET"])
def memory_info():
    try:
        # ──────────────────────────────
        # Info básica del sistema
        # ──────────────────────────────
        memory = psutil.virtual_memory()
        total_gb = round(memory.total / (1024**3), 2)
        available_gb = round(memory.available / (1024**3), 2)

        # ──────────────────────────────
        # Ejecutar dmidecode para obtener detalles físicos
        # ──────────────────────────────
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

                    # Tamaño del módulo
                    if key == "size":
                        if "no module installed" in value.lower():
                            current_slot["size_gb"] = 0
                            current_slot["status"] = "Empty"
                        else:
                            num = "".join([c for c in value if c.isdigit()])
                            if num:
                                size = int(num)
                                if "mb" in value.lower():
                                    size = round(size / 1024, 2)
                                current_slot["size_gb"] = size
                                current_slot["status"] = "Occupied"

            # Fin de bloque o final del archivo
            if (line == "" and in_device) or line == output.splitlines()[-1]:
                if current_slot:
                    # Filtrar solo si hay un "Locator" o "Bank Locator"
                    locator = current_slot.get("locator") or current_slot.get("bank_locator")
                    if locator:
                        slots.append(current_slot)
                current_slot = {}
                in_device = False

        # ──────────────────────────────
        # Normalización y resumen
        # ──────────────────────────────
        for s in slots:
            s["locator"] = s.get("locator", "Desconocido")
            s["manufacturer"] = s.get("manufacturer", "N/A")
            s["type"] = s.get("type", "Desconocido")
            s["speed"] = s.get("speed", "Desconocido")

            if s.get("status") != "Occupied" and s.get("size_gb", 0) == 0:
                s["status"] = "Empty"

        # Calcular frecuencia promedio y tipo dominante
        speeds = []
        types = []
        for s in slots:
            if s.get("speed") and re.search(r"\d+", s["speed"]):
                speeds.append(int(re.search(r"\d+", s["speed"]).group()))
            if s.get("type") and "DDR" in s["type"]:
                types.append(s["type"])

        avg_speed = round(sum(speeds) / len(speeds), 0) if speeds else None
        mem_type = max(set(types), key=types.count) if types else "Desconocido"

        # ──────────────────────────────
        # Devolver respuesta
        # ──────────────────────────────
        return jsonify({
            "memory_percent": memory.percent,
            "memory_total_gb": total_gb,
            "memory_available_gb": available_gb,
            "memory_type": mem_type,
            "memory_speed_mts": avg_speed,
            "total_slots": len(slots),
            "slots": slots
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
