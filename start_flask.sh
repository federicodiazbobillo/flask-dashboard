#!/bin/bash
cd /opt/flask-react/backend
source venv/bin/activate
fuser -k 5000/tcp
flask run --host=0.0.0.0 --port=5000