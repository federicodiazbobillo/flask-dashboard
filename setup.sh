#!/bin/bash
set -e  # detener en error

echo "🚀 Iniciando setup de Flask + React..."

# ──────────────────────────────
# Backend (Flask / Python)
# ──────────────────────────────
echo "📦 Instalando dependencias de backend (Python)..."

cd backend

# Crear venv si no existe
if [ ! -d "venv" ]; then
  echo "➕ Creando entorno virtual..."
  python3 -m venv venv
fi

# Activar venv
source venv/bin/activate

# Instalar requirements.txt
if [ -f "requirements.txt" ]; then
  echo "📄 Instalando requirements.txt..."
  pip install --upgrade pip
  pip install -r requirements.txt
else
  echo "⚠️ No se encontró requirements.txt en backend/"
fi

deactivate
cd ..

# ──────────────────────────────
# Frontend (React / Vite)
# ──────────────────────────────
echo "📦 Instalando dependencias de frontend (Node.js)..."

cd frontend

# Verificar que package.json exista
if [ -f "package.json" ]; then
  echo "📄 Instalando dependencias npm..."
  npm install
else
  echo "⚠️ No se encontró package.json en frontend/"
fi

cd ..

echo "✅ Setup completo!"
