from flask import Blueprint, jsonify
import GPUtil

gpu_bp = Blueprint("gpu_info", __name__)

@gpu_bp.route("/api/server-info/gpu/", methods=["GET"])
def get_gpu_info():
    try:
        gpus = GPUtil.getGPUs()
        gpu_data = []
        for gpu in gpus:
            gpu_data.append({
                "id": gpu.id,
                "name": gpu.name,
                "load": round(gpu.load * 100, 1),        # %
                "memoryTotal": round(gpu.memoryTotal, 1), # MB
                "memoryUsed": round(gpu.memoryUsed, 1),   # MB
                "temperature": gpu.temperature,           # °C
            })
        return jsonify({"gpus": gpu_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
