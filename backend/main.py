from flask import Flask
from flask_cors import CORS
from api import bp as api_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # 🔑 Permitir que todas las rutas funcionen con o sin barra final
    app.url_map.strict_slashes = False

    app.register_blueprint(api_bp)
    return app
