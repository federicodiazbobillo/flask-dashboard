from flask import Flask
from blueprint_loader import register_blueprints
import api

def create_app():
    app = Flask(__name__)

    # Carga automática de todos los blueprints en api/
    register_blueprints(app, api.__name__, api.__path__)

    return app
