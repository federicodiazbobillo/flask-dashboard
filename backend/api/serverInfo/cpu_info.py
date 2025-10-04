from flask import Blueprint, jsonify
import psutil
import subprocess
import re
import os

bp = Blueprint("cpu_info", __name__, url_prefix="/server-info/cpu")

def _parse_lscpu_topology():
    """
    Returns:
      sockets: int
      mapping: {socket_id: {"logical_cpus": [int,...]}}
      numa_nodes: int or None
    """
    sockets = 0
    mapping = {}
    numa_nodes = None

    # Usamos lscpu en formato CSV para evitar problemas de locale
    try:
        # CPU,SOCKET,NODE
        res = subprocess.run(["lscpu", "-p=CPU,SOCKET,NODE"], capture_output=True, text=True, check=False)
        if res.stdout:
            for line in res.stdout.splitlines():
                if not line or line.startswith("#"):
                    continue
                parts = line.split(",")
                if len(parts) >= 2:
                    cpu_id = int(parts[0])
                    socket_id = parts[1]
                    mapping.setdefault(socket_id, {"logical_cpus": []})
                    mapping[socket_id]["logical_cpus"].append(cpu_id)
            sockets = len(mapping)
            if sockets == 0:
                mapping = {}

        # NUMA nodes
        res2 = subprocess.run(["lscpu"], capture_output=True, text=True, check=False)
        if res2.stdout:
            m = re.search(r"NUMA node\(s\):\s+(\d+)", res2.stdout)
            if m:
                numa_nodes = int(m.group(1))
    except Exception:
        pass

    # Fallback a /proc/cpuinfo si lscpu falló
    if sockets == 0:
        physical_ids = set()
        try:
            with open("/proc/cpuinfo", "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if line.lower().startswith("physical id"):
                        _, val = line.split(":", 1)
                        physical_ids.add(val.strip())
            sockets = len(physical_ids) if physical_ids else 1
            mapping = {str(i): {"logical_cpus": []} for i in range(sockets)}
        except Exception:
            sockets = None

    return sockets or None, mapping or None, numa_nodes

@bp.route("/", methods=["GET"])
def cpu_info():
    try:
        # Modelo / marca (best-effort)
        model = None
        try:
            with open("/proc/cpuinfo", "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if "model name" in line:
                        model = line.split(":", 1)[1].strip()
                        break
        except Exception:
            pass
        if not model:
            model = "Desconocido"

        # Núcleos
        cores_physical = psutil.cpu_count(logical=False) or 0
        cores_logical = psutil.cpu_count(logical=True) or 0

        # Frecuencias
        freq = psutil.cpu_freq()
        freq_current = round(freq.current, 0) if freq and freq.current else None
        freq_min = round(freq.min, 0) if freq and freq.min else None
        freq_max = round(freq.max, 0) if freq and freq.max else None

        # Uso
        usage_total = psutil.cpu_percent(interval=0.5)
        usage_per_core = psutil.cpu_percent(interval=0.5, percpu=True)

        # Carga (1,5,15)
        try:
            load1, load5, load15 = os.getloadavg()
            load_avg = {"1m": round(load1, 2), "5m": round(load5, 2), "15m": round(load15, 2)}
        except Exception:
            load_avg = None

        # Topología (sockets / NUMA)
        sockets, topo_map, numa_nodes = _parse_lscpu_topology()

        # Temperatura (si está disponible)
        temperature_c = None
        try:
            temps = psutil.sensors_temperatures()
            for key in ("coretemp", "k10temp", "cpu-thermal", "acpitz"):
                if key in temps and temps[key]:
                    vals = [t.current for t in temps[key] if hasattr(t, "current") and t.current is not None]
                    if vals:
                        temperature_c = round(sum(vals)/len(vals), 1)
                        break
        except Exception:
            pass

        return jsonify({
            "model": model,
            "cores_physical": cores_physical,
            "cores_logical": cores_logical,
            "freq_current_mhz": freq_current,
            "freq_min_mhz": freq_min,
            "freq_max_mhz": freq_max,
            "cpu_percent_total": usage_total,
            "cpu_percent_per_core": usage_per_core,
            "temperature_c": temperature_c,
            "load_avg": load_avg,
            "sockets": sockets,          # 👈 aquí vas a ver 2 si es dual-CPU
            "numa_nodes": numa_nodes,
            "topology": topo_map         # mapa de CPUs por socket
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
