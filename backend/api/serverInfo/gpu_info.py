from flask import Blueprint, jsonify
import subprocess

bp = Blueprint("gpu_info", __name__, url_prefix="/server-info/gpu")


@bp.route("/", methods=["GET"])
def gpu_root():
    # Intentar usar GPUtil; responder elegante si no está disponible
    try:
        import GPUtil  # type: ignore
    except Exception as e:
        return jsonify({"gpus": [], "warning": f"GPUs no disponibles: {e}"}), 200

    try:
        gpus = GPUtil.getGPUs()
        data = []

        # Consultar fan y power via nvidia-smi
        try:
            smi_out = subprocess.check_output(
                [
                    "nvidia-smi",
                    "--query-gpu=fan.speed,power.draw,enforced.power.limit",
                    "--format=csv,noheader,nounits",
                ],
                encoding="utf-8",
            )
            smi_lines = [line.strip() for line in smi_out.splitlines() if line.strip()]
        except Exception as e:
            smi_lines = []
            print("Error ejecutando nvidia-smi:", e)

        for idx, g in enumerate(gpus):
            # Datos básicos de GPUtil
            gpu_info = {
                "id": g.id,
                "name": g.name,
                "load": round(g.load * 100, 1),          # %
                "memoryTotal": round(g.memoryTotal, 1),  # MB
                "memoryUsed": round(g.memoryUsed, 1),    # MB
                "temperature": getattr(g, "temperature", None),
                "fan_speed": None,
                "power_draw_watts": None,
                "power_limit_watts": None,
                "power_draw_amperes_est": None,
            }

            # Si tenemos salida de nvidia-smi, parsear
            if idx < len(smi_lines):
                parts = [p.strip() for p in smi_lines[idx].split(",")]
                if len(parts) >= 3:
                    try:
                        fan = float(parts[0])
                        power_draw = float(parts[1])
                        power_limit = float(parts[2])

                        gpu_info["fan_speed"] = fan  # %
                        gpu_info["power_draw_watts"] = power_draw
                        gpu_info["power_limit_watts"] = power_limit

                        # Calculo estimado de amperes (12V rail)
                        gpu_info["power_draw_amperes_est"] = round(power_draw / 12, 2)
                    except Exception:
                        pass

            data.append(gpu_info)

        return jsonify({"gpus": data})

    except Exception as e:
        return jsonify({"gpus": [], "error": str(e)}), 200
