from flask import Flask, Blueprint
from blueprint_loader import register_blueprints
import api

def create_app():
    app = Flask(__name__)

    # Blueprint raíz para todo lo que sea /api
    api_bp = Blueprint("api", __name__, url_prefix="/api")

    # Registrar automáticamente todos los módulos dentro de api/*
    register_blueprints(api_bp, api.__name__, api.__path__)

    # Montar el blueprint raíz en la app
    app.register_blueprint(api_bp)

    return app
