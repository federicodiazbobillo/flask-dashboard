from flask import Blueprint, jsonify
import psutil
import subprocess
import re

bp = Blueprint("memory_info", __name__, url_prefix="/server-info/memory")

DMIDECODE_BIN = "/usr/sbin/dmidecode"
 
def _parse_int_mb(text):
    # Devuelve tamaño en MB, o None si no hay módulo
    if not text or "No Module Installed" in text:
        return None
    m = re.search(r"(\d+)\s*(MB|GB)", text, re.IGNORECASE)
    if not m:
        return None
    val = int(m.group(1))
    unit = m.group(2).upper()
    if unit == "GB":
        return val * 1024
    return val
 
def _safe_run(cmd):
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        return res.stdout
    except Exception:
        return ""

def _read_dmidecode_memory():
    """
    Lee 'dmidecode -t memory' y devuelve slots reales (ocupados y vacíos),
    deduplicando por (Locator, Bank Locator) para evitar inflar el conteo.
    """
    out = _safe_run([DMIDECODE_BIN, "-t", "memory"])
    if not out:
        # Intento sin ruta absoluta (por si sudoers permite dmidecode sin password)
        out = _safe_run(["dmidecode", "-t", "memory"])

    slots = []
    current = None
    for raw_line in out.splitlines():
        line = raw_line.strip()
        if line.startswith("Memory Device"):
            if current:
                slots.append(current)
            current = {"locator": None, "bank_locator": None, "size_mb": None, "type": None, "speed_mts": None, "configured_mts": None}
            continue
        if current is None:
            continue
        if line.startswith("Locator:"):
            current["locator"] = line.split("Locator:",1)[1].strip()
        elif line.startswith("Bank Locator:"):
            current["bank_locator"] = line.split("Bank Locator:",1)[1].strip()
        elif line.startswith("Size:"):
            current["size_mb"] = _parse_int_mb(line.split("Size:",1)[1].strip())
        elif line.startswith("Type:"):
            current["type"] = line.split("Type:",1)[1].strip()
        elif line.startswith("Speed:"):
            s = line.split("Speed:",1)[1].strip()
            m = re.search(r"(\d+)\s*MT/s", s, re.IGNORECASE)
            current["speed_mts"] = int(m.group(1)) if m else None
        elif line.startswith("Configured Clock Speed:"):
            s = line.split("Configured Clock Speed:",1)[1].strip()
            m = re.search(r"(\d+)\s*MT/s", s, re.IGNORECASE)
            current["configured_mts"] = int(m.group(1)) if m else None
    if current:
        slots.append(current)

    # Filtrar "no slots" obvios, pero conservar vacíos reales
    filtered = []
    for s in slots:
        # Conservamos si tiene Locator y (está instalado) o el tipo luce como DIMM/DDR
        if s["locator"] and (s["size_mb"] is not None or any(k in (s["type"] or "") for k in ["DDR", "SDRAM", "DIMM", "SO-DIMM"])):
            filtered.append(s)

    # Deduplicar por (Locator, Bank Locator) – evita ver 24 cuando hay 8 reales
    dedup = {}
    for s in filtered:
        key = (s["locator"], s["bank_locator"])
        if key in dedup:
            # Si hay duplicado, priorizar el que tiene tamaño (instalado)
            if dedup[key].get("size_mb") is None and s.get("size_mb") is not None:
                dedup[key] = s
        else:
            dedup[key] = s

    slots_dedup = list(dedup.values())
    slots_dedup.sort(key=lambda x: (x["bank_locator"] or "", x["locator"] or ""))

    return {
        "raw_device_count": len(slots),       # Conteo crudo de dmidecode
        "after_filter_count": len(filtered),  # Luego de filtro
        "total_slots": len(slots_dedup),      # 👈 Este debería ser 8 en tu placa
        "slots": [
            {
                "slot": s["locator"],
                "bank_locator": s["bank_locator"],
                "installed": s["size_mb"] is not None,
                "size_gb": round(s["size_mb"]/1024, 2) if s["size_mb"] else None,
                "type": s["type"],
                "speed_mts": s["speed_mts"],
                "configured_mts": s["configured_mts"]
            } for s in slots_dedup
        ]
    }

@bp.route("/", methods=["GET"])
def memory_info():
    try:
        vm = psutil.virtual_memory()
        total_gb = round(vm.total / (1024**3), 2)
        available_gb = round(vm.available / (1024**3), 2)

        topo = _read_dmidecode_memory()
        populated = sum(1 for s in topo["slots"] if s["installed"])
        empty = topo["total_slots"] - populated

        return jsonify({
            "memory_percent": vm.percent,
            "memory_total_gb": total_gb,
            "memory_available_gb": available_gb,
            "total_slots": topo["total_slots"],
            "populated_slots": populated,    # 👈 ocupados
            "empty_slots": empty,            # 👈 vacíos
            "slots": topo["slots"],          # listado completo (ocupados + vacíos)
            "debug": {
                "dmidecode_raw_devices": topo["raw_device_count"],
                "after_filter_count": topo["after_filter_count"],
                "source": "dmidecode"
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
