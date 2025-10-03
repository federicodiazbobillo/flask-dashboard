from flask import Blueprint, jsonify
import psutil
import socket

bp = Blueprint("net_info", __name__, url_prefix="/server-info/net")

@bp.route("/", methods=["GET"])
def net_root():
    try:
        stats = psutil.net_if_stats()
        addrs = psutil.net_if_addrs()

        def get_ipv4(name):
            for a in addrs.get(name, []):
                if a.family == socket.AF_INET:
                    return a.address
            return None

        # psutil.AF_LINK puede no existir en algunas plataformas; 17 es común en Linux
        AF_LINK = getattr(psutil, "AF_LINK", 17)

        def get_mac(name):
            for a in addrs.get(name, []):
                if a.family == AF_LINK and a.address:
                    return a.address
            return None

        interfaces = []
        for name, st in stats.items():
            interfaces.append({
                "name": name,
                "isup": st.isup,
                "speed": st.speed,  # Mbps
                "mtu": st.mtu,
                "ip": get_ipv4(name),
                "mac": get_mac(name),
            })

        return jsonify({"interfaces": interfaces})
    except Exception as e:
        return jsonify({"interfaces": [], "error": str(e)}), 200
