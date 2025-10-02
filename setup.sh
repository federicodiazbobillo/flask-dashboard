#!/bin/bash
set -e

echo "🚀 Iniciando setup de servidor Flask + React..."

# ──────────────────────────────
# Permisos: permitir root o el usuario 'dashboard'
# ──────────────────────────────
if [ "$EUID" -ne 0 ] && [ "$USER" != "dashboard" ]; then
  echo "⚠️ Este script debe ejecutarse con sudo (root) o como 'dashboard'"
  exit 1
fi

# ──────────────────────────────
# FASE ROOT
# ──────────────────────────────
if [ "$EUID" -eq 0 ] && [ "$USER" != "dashboard" ]; then
  # Dependencias del sistema (sin nodejs/npm de apt)
  if command -v apt >/dev/null 2>&1; then
    echo "📦 Instalando dependencias del sistema con apt..."
    apt update -y
    apt install -y \
      python3 python3-venv python3-pip \
      git curl build-essential \
      dmidecode lshw hwinfo psmisc lsof
  else
    echo "⚠️ apt no disponible, saltando instalación de paquetes de sistema"
  fi

  # Usuario dedicado
  if ! id -u dashboard >/dev/null 2>&1; then
    echo "👤 Creando usuario 'dashboard'..."
    useradd -m -s /bin/bash dashboard
  fi

  # Sudoers para comandos de hardware
  echo "🔑 Configurando sudoers para usuario 'dashboard'..."
  echo "dashboard ALL=(ALL) NOPASSWD: /usr/sbin/dmidecode, /usr/bin/lshw, /usr/bin/hwinfo" | tee /etc/sudoers.d/dashboard >/dev/null
  chmod 440 /etc/sudoers.d/dashboard

  # Permisos del proyecto
  PROJECT_DIR="$(pwd)"
  chown -R dashboard:dashboard "$PROJECT_DIR"

  # Re-ejecutar como dashboard (fase usuario)
  echo "🔄 Re-ejecutando setup como usuario 'dashboard'..."
  exec sudo -u dashboard -H bash "$0"
fi

# ──────────────────────────────
# FASE USUARIO (dashboard)
# ──────────────────────────────
PROJECT_DIR="$(pwd)"

# Node.js con NVM
echo "📦 Configurando Node.js con NVM..."
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Instalar Node 22 LTS
nvm install 22
nvm alias default 22
nvm use 22

echo "✅ Node.js versión instalada:"
node -v
npm -v

# Backend (Flask)
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

# Frontend (React + Tailwind)
echo "📦 Configurando frontend (React + Tailwind)..."
cd frontend
if [ -f "package.json" ]; then
  echo "→ Ejecutando npm install..."
  if ! npm install; then
    echo "⚠️ Conflicto detectado, reintentando con --legacy-peer-deps"
    npm install --legacy-peer-deps
  fi

  echo "➕ Instalando dependencias extra del dashboard..."
  npm install react-gauge-chart

  echo "🎨 Instalando TailwindCSS + PostCSS + Autoprefixer..."
  npm install -D tailwindcss postcss autoprefixer

  # Config de Tailwind
  if [ ! -f "tailwind.config.js" ]; then
    npx tailwindcss init -p
    cat > tailwind.config.js << 'EOF'
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
EOF
  fi

  # CSS base
  if [ ! -f "src/index.css" ]; then
    mkdir -p src
    cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-900 text-white;
}
EOF
  fi
fi

# 🔒 Ajustar permisos de frontend SIEMPRE
echo "🔒 Ajustando permisos de frontend..."
chown -R dashboard:dashboard "$PROJECT_DIR/frontend"
cd ..

# Scripts de inicio
echo "⚙️ Creando scripts de inicio..."
cat > start_flask.sh << 'EOF'
#!/bin/bash
cd backend

# Activar NVM y Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

# Activar entorno Python
source venv/bin/activate

# Matar procesos previos en el puerto 5000
PID=$(lsof -t -i:5000)
if [ -n "$PID" ]; then
  echo "🔪 Matando proceso en puerto 5000 (PID $PID)"
  kill -9 $PID
fi

export FLASK_APP=wsgi.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
EOF
chmod +x start_flask.sh


cat > start_react.sh << 'EOF'
#!/bin/bash
cd frontend

# Activar NVM y Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

# Matar procesos previos en el puerto 5173
PID=$(lsof -t -i:5173)
if [ -n "$PID" ]; then
  echo "🔪 Matando proceso en puerto 5173 (PID $PID)"
  kill -9 $PID
fi

npm run dev -- --host 0.0.0.0 --port=5173
EOF
chmod +x start_react.sh

# Resumen final
echo ""
echo "✅ Setup completo!"
echo "👉 Usuario de ejecución: dashboard"
echo "👉 Levantar backend: ./start_flask.sh"
echo "👉 Levantar frontend: ./start_react.sh"
