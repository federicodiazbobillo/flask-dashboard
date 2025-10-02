from flask import Flask
from flask_cors import CORS
from api import bp as api_bp

app = Flask(__name__)
CORS(app)

# registrar las rutas del blueprint
app.register_blueprint(api_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
