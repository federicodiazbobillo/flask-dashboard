from .cpu_info import cpu_bp
from .memory_info import memory_bp
from .storage_info import storage_bp
from .gpu_info import gpu_bp
from .net_info import net_bp

bp_modules = [cpu_bp, memory_bp, storage_bp, gpu_bp, net_bp]

def register_blueprints(app):
    app.register_blueprint(cpu_bp)
    app.register_blueprint(memory_bp)
    app.register_blueprint(storage_bp)
    app.register_blueprint(gpu_bp)
    app.register_blueprint(net_bp)
