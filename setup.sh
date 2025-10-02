#!/bin/bash
set -e  # detener si algo falla

echo "🚀 Iniciando setup de Flask + React..."

# ──────────────────────────────
# Backend (Flask / Python)
# ──────────────────────────────
echo "📦 Instalando dependencias de backend..."

cd backend

# Crear venv si no existe
if [ ! -d "venv" ]; then
  echo "➕ Creando entorno virtual..."
  python3 -m venv venv
fi

# Activar venv y pip install
source venv/bin/activate
if [ -f "requirements.txt" ]; then
  pip install --upgrade pip
  pip install -r requirements.txt
else
  echo "⚠️ No se encontró requirements.txt"
fi
deactivate
cd ..

# ──────────────────────────────
# Frontend (React / Vite)
# ──────────────────────────────
echo "📦 Instalando dependencias de frontend..."

cd frontend
if [ -f "package.json" ]; then
  npm install
else
  echo "⚠️ No se encontró package.json"
fi
cd ..

# ──────────────────────────────
# Crear scripts de inicio locales
# ──────────────────────────────
echo "⚙️ Creando scripts de inicio..."

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

echo "✅ Setup completo. Usá ./start_flask.sh y ./start_react.sh para iniciar los servicios."
