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
# Limpiar puertos antes de iniciar
# ──────────────────────────────
echo "🛑 Verificando procesos en puertos 5000 y 5173..."

for PORT in 5000 5173; do
  PID=$(sudo lsof -t -i:$PORT || true)
  if [ -n "$PID" ]; then
    echo "🔪 Matando proceso en puerto $PORT (PID $PID)"
    sudo kill -9 $PID || true
  fi
done

# ──────────────────────────────
# FASE ROOT
# ──────────────────────────────
if [ "$EUID" -eq 0 ] && [ "$USER" != "dashboard" ]; then
  if command -v apt >/dev/null 2>&1; then
    echo "📦 Instalando dependencias del sistema con apt..."
    apt update -y
    apt install -y \
      python3 python3-venv python3-pip \
      git curl build-essential \
      dmidecode lshw hwinfo util-linux psmisc lsof \
      nvidia-cuda-toolkit 
  else
    echo "⚠️ apt no disponible, saltando instalación de paquetes de sistema"
  fi

  if ! id -u dashboard >/dev/null 2>&1; then
    echo "👤 Creando usuario 'dashboard'..."
    useradd -m -s /bin/bash dashboard
  fi

  echo "🔑 Configurando sudoers para usuario 'dashboard'..."
  echo "dashboard ALL=(ALL) NOPASSWD: /usr/sbin/dmidecode, /usr/bin/lshw, /usr/bin/hwinfo, /usr/bin/lsof, /bin/kill" \
    | tee /etc/sudoers.d/dashboard >/dev/null
  chmod 440 /etc/sudoers.d/dashboard

  PROJECT_DIR="$(pwd)"
  chown -R dashboard:dashboard "$PROJECT_DIR"

  # ──────────────────────────────
  # PREGUNTA MODO DE INSTALACIÓN
  # ──────────────────────────────
  echo ""
  echo "¿Cómo querés instalar el dashboard?"
  echo "1) Modo manual (scripts ./start_flask.sh y ./start_react.sh)"
  echo "2) Modo servicio (systemd, arranca solo en cada boot)"
  read -p "Opción [1/2]: " INSTALL_MODE

  # Guardamos la elección en archivo temporal para usar después
  echo "$INSTALL_MODE" > /tmp/dashboard_install_mode

  if [ "$INSTALL_MODE" = "2" ]; then
    echo "⚙️ Creando wrapper start_all.sh..."
    cat > "$PROJECT_DIR/start_all.sh" << 'EOF'
#!/bin/bash
set -e
./start_flask.sh &
./start_react.sh
EOF
    chmod +x "$PROJECT_DIR/start_all.sh"

    echo "⚙️ Creando servicio systemd..."
    SERVICE_FILE=/etc/systemd/system/dashboard.service
    tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Dashboard Flask + React
After=network.target

[Service]
User=dashboard
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/start_all.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    echo "🔄 Habilitando servicio..."
    systemctl daemon-reload
    systemctl enable --now dashboard.service

    echo "✅ Instalación como servicio completa!"
  else
    echo "✅ Instalación en modo manual seleccionada!"
  fi

  echo "🔄 Re-ejecutando setup como usuario 'dashboard'..."
  exec sudo -u dashboard -H bash "$0"
  exit 0
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

nvm install 22
nvm alias default 22
nvm use 22

echo "✅ Node.js versión instalada:"
node -v
npm -v

# Backend
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
  npm install recharts

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

echo "🔒 Ajustando permisos de frontend..."
chown -R dashboard:dashboard "$PROJECT_DIR/frontend"
cd ..

# Scripts de inicio
echo "⚙️ Creando scripts de inicio..."

# start_flask.sh
cat > start_flask.sh << 'EOF'
#!/bin/bash
if [ "$USER" != "dashboard" ]; then
  exec sudo -u dashboard -H bash "$0" "$@"
fi

cd backend
source venv/bin/activate

PID=$(sudo lsof -t -i:5000)
if [ -n "$PID" ]; then
  echo "🔪 Matando proceso en puerto 5000 (PID $PID)"
  sudo kill -9 $PID || true
fi

export FLASK_APP=wsgi.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
EOF
chmod +x start_flask.sh

# start_react.sh
cat > start_react.sh << 'EOF'
#!/bin/bash
if [ "$USER" != "dashboard" ]; then
  exec sudo -u dashboard -H bash "$0" "$@"
fi

cd frontend
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

PID=$(sudo lsof -t -i:5173)
if [ -n "$PID" ]; then
  echo "🔪 Matando proceso en puerto 5173 (PID $PID)"
  sudo kill -9 $PID || true
fi

npm run dev -- --host 0.0.0.0 --port=5173
EOF
chmod +x start_react.sh

# update.sh
cat > update.sh << 'EOF'
#!/bin/bash
set -e
if [ "$USER" != "dashboard" ]; then
  exec sudo -u dashboard -H bash "$0" "$@"
fi

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📥 Git pull..."
cd "$PROJECT_DIR"
git pull

echo "🐍 Backend: requirements..."
cd backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo "🟦 Frontend: npm install..."
cd ../frontend
if ! npm install; then
  npm install --legacy-peer-deps
fi

echo "🔒 Ajustando permisos..."
cd "$PROJECT_DIR"
chown -R dashboard:dashboard "$PROJECT_DIR"

echo "✅ Update completo!"
EOF
chmod +x update.sh

# ──────────────────────────────
# RESUMEN FINAL
# ──────────────────────────────
INSTALL_MODE=$(cat /tmp/dashboard_install_mode)

echo ""
if [ "$INSTALL_MODE" = "2" ]; then
  echo "✅ Setup completo en modo servicio (systemd)!"
  echo "👉 El dashboard arranca solo en cada boot"
  echo "👉 Manejo: systemctl start|stop|status dashboard"
  echo "👉 Logs: journalctl -u dashboard -f"
else
  echo "✅ Setup completo en modo manual!"
  echo "👉 Usuario de ejecución: dashboard"
  echo "👉 Levantar backend: ./start_flask.sh"
  echo "👉 Levantar frontend: ./start_react.sh"
  echo "👉 Actualizar proyecto: ./update.sh"
fi
