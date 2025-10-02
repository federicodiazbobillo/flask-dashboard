#!/bin/bash
set -e

echo "🚀 Iniciando setup de servidor Flask + React..."

# ──────────────────────────────
# Dependencias de sistema
# ──────────────────────────────
if command -v apt >/dev/null 2>&1; then
  echo "📦 Instalando dependencias del sistema con apt..."
  sudo apt update -y
  sudo apt install -y \
    python3 python3-venv python3-pip \
    nodejs npm git curl build-essential
else
  echo "⚠️ apt no disponible, saltando instalación de paquetes de sistema"
fi

# ──────────────────────────────
# Asegurar permisos correctos
# ──────────────────────────────
echo "🔑 Ajustando permisos de la carpeta del proyecto..."
sudo chown -R $USER:$USER "$(pwd)"

# ──────────────────────────────
# Backend (Flask)
# ──────────────────────────────
echo "📦 Configurando backend (Flask)..."

cd backend
if [ ! -d "venv" ]; then
  echo "➕ Creando entorno virtual en backend/venv"
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
echo "📦 Configurando frontend (React)..."

cd frontend
if [ -f "package.json" ]; then
  echo "→ Ejecutando npm install..."
  if ! npm install; then
    echo "⚠️ Conflicto detectado, reintentando con --legacy-peer-deps"
    npm install --legacy-peer-deps
  fi

  echo "➕ Instalando dependencias extra del dashboard..."
  npm install react-gauge-chart
fi
cd ..

# ──────────────────────────────
# Scripts de inicio
# ──────────────────────────────
echo "⚙️ Creando scripts de inicio..."

cat > start_flask.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
fuser -k 5000/tcp || true

export FLASK_APP=wsgi.py
export FLASK_ENV=development

flask run --host=0.0.0.0 --port=5000
EOF
chmod +x start_flask.sh

cat > start_react.sh << 'EOF'
#!/bin/bash
cd frontend
fuser -k 5173/tcp || true
npm run dev -- --host 0.0.0.0 --port=5173
EOF
chmod +x start_react.sh

# ──────────────────────────────
# Resumen final
# ──────────────────────────────
echo ""
echo "✅ Setup completo!"
echo "👉 Levantar backend: ./start_flask.sh"
echo "👉 Levantar frontend: ./start_react.sh"
