from flask import Flask
from flask_cors import CORS
from api import bp as api_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    # Permitir rutas con y sin barra final
    app.url_map.strict_slashes = False
    app.register_blueprint(api_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)