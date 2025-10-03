from flask import Blueprint, jsonify

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
        data = [{
            "id": g.id,
            "name": g.name,
            "load": round(g.load * 100, 1),          # %
            "memoryTotal": round(g.memoryTotal, 1),  # MB
            "memoryUsed": round(g.memoryUsed, 1),    # MB
            "temperature": getattr(g, "temperature", None),
        } for g in gpus]
        return jsonify({"gpus": data})
    except Exception as e:
        return jsonify({"gpus": [], "error": str(e)}), 200
