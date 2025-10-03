from .serverInfo.cpu_info import cpu_bp
from .serverInfo.memory_info import memory_bp
from .serverInfo.storage_info import storage_bp
from .serverInfo.gpu_info import gpu_bp
from .serverInfo.net_info import net_bp

def register_blueprints(app):
    app.register_blueprint(cpu_bp)
    app.register_blueprint(memory_bp)
    app.register_blueprint(storage_bp)
    app.register_blueprint(gpu_bp)
    app.register_blueprint(net_bp)
