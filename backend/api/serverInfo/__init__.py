from flask import Blueprint
from .cpu_info import bp as cpu_bp
from .memory_info import bp as memory_bp
from .storage_info import bp as storage_bp
from .gpu_info import bp as gpu_bp
from .net_info import bp as net_bp

bp = Blueprint("server_info", __name__, url_prefix="/server-info")

# Registrar sub-blueprints
bp.register_blueprint(cpu_bp)
bp.register_blueprint(memory_bp)
bp.register_blueprint(storage_bp)
bp.register_blueprint(gpu_bp)
bp.register_blueprint(net_bp)
