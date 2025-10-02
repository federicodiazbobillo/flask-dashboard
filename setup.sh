#!/bin/bash
set -e

echo "🚀 Iniciando setup de servidor Flask + React..."

# ──────────────────────────────
# Paquetes base con apt
# ──────────────────────────────
echo "📦 Instalando dependencias del sistema (apt)..."

sudo apt update -y
sudo apt install -y \
  python3 python3-venv python3-pip \
  nodejs npm git curl build-essential

# ──────────────────────────────
# Backend (Python)
# ──────────────────────────────
echo "📦 Backend (Flask)..."
cd backend
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
[ -f "requirements.txt" ] && pip install -r requirements.txt
deactivate
cd ..

# ──────────────────────────────
# Frontend (React)
# ──────────────────────────────
echo "📦 Frontend (React)..."
cd frontend
[ -f "package.json" ] && npm install
cd ..

# ──────────────────────────────
# Scripts de inicio
# ──────────────────────────────
echo "⚙️ Creando scripts de inicio locales..."

cat > start_flask.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
fuser -k 5000/tcp
FLASK_ENV=development flask run --host=0.0.0.0 --port=5000
EOF
chmod +x start_flask.sh

cat > start_react.sh << 'EOF'
#!/bin/bash
cd frontend
fuser -k 5173/tcp
npm run dev -- --host 0.0.0.0 --port 5173
EOF
chmod +x start_react.sh

echo "✅ Setup completo. Usa ./start_flask.sh y ./start_react.sh"
