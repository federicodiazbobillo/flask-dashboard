from flask import Blueprint, jsonify
import psutil

net_bp = Blueprint("net_info", __name__)

@net_bp.route("/api/server-info/net/", methods=["GET"])
def get_net_info():
    try:
        stats = psutil.net_if_stats()
        addrs = psutil.net_if_addrs()

        interfaces = []
        for name, stat in stats.items():
            interfaces.append({
                "name": name,
                "isup": stat.isup,
                "speed": stat.speed,   # Mbps
                "mtu": stat.mtu,
                "mac": next((addr.address for addr in addrs.get(name, []) if addr.family == 17), None),
                "ip": next((addr.address for addr in addrs.get(name, []) if addr.family == 2), None),
            })

        return jsonify({"interfaces": interfaces})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
