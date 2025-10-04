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

    if [ -f "apt-requirements.txt" ]; then
      echo "📜 Leyendo dependencias desde apt-requirements.txt..."
      grep -vE '^\s*#' apt-requirements.txt | xargs apt install -y
    else
      echo "⚠️ No se encontró apt-requirements.txt, usando lista mínima por defecto."
      apt install -y python3 python3-venv python3-pip git curl build-essential
    fi
  else
    echo "⚠️ apt no disponible, saltando instalación de paquetes de sistema"
  fi

  # ──────────────────────────────
  # DETECCIÓN Y CONFIGURACIÓN DE GPU NVIDIA
  # ──────────────────────────────
  echo "🧠 Verificando presencia de GPU NVIDIA..."
  if lspci | grep -i nvidia >/dev/null 2>&1; then
    echo "💡 GPU NVIDIA detectada. Verificando driver y utilidades..."
    if ! command -v nvidia-smi >/dev/null 2>&1; then
      echo "⚙️ Instalando driver y utilidades NVIDIA (versión server recomendada)..."
      apt install -y ubuntu-drivers-common
      if ! ubuntu-drivers autoinstall; then
        echo "⚠️ Fallback: instalando driver estable nvidia-driver-580-server"
        apt install -y nvidia-driver-580-server nvidia-utils-580-server
      fi
    else
      echo "✅ NVIDIA driver ya instalado: $(nvidia-smi --query-gpu=driver_version --format=csv,noheader)"
    fi
  else
    echo "ℹ️ No se detectaron GPUs NVIDIA en este equipo."
  fi

  # ──────────────────────────────
  # CREAR USUARIO DASHBOARD
  # ──────────────────────────────
  if ! id -u dashboard >/dev/null 2>&1; then
    echo "👤 Creando usuario 'dashboard'..."
    useradd -m -s /bin/bash dashboard
  fi

  echo "🔑 Configurando sudoers para usuario 'dashboard'..."
  echo "dashboard ALL=(ALL) NOPASSWD: /usr/sbin/dmidecode, /usr/bin/lshw, /usr/bin/hwinfo, /usr/bin/lscpu, /usr/bin/lsof, /bin/kill" \
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

# Frontend
echo "📦 Configurando frontend (React + Tailwind)..."
cd frontend
if [ -f "package.json" ]; then
  echo "→ Ejecutando npm install..."
  if ! npm install; then
    echo "⚠️ Conflicto detectado, reintentando con --legacy-peer-deps"
    npm install --legacy-peer-deps
  fi

  echo "➕ Instalando dependencias extra del dashboard..."
  npm install react-gauge-chart recharts
  npm install lucide-react  # 👈 nuevo: iconos UI
  npm install -D tailwindcss postcss autoprefixer

  if [ ! -f "tailwind.config.js" ]; then
    npx tailwindcss init -p
  fi
fi
cd "$PROJECT_DIR"

# Scripts de inicio
echo "⚙️ Generando scripts de inicio..."
# (sin cambios en start_flask.sh / start_react.sh / update.sh — se mantienen)

# ──────────────────────────────
# REINICIO AUTOMÁTICO SI SE INSTALÓ DRIVER NVIDIA
# ──────────────────────────────
if [ "$EUID" -eq 0 ]; then
  if dpkg -l | grep -q "nvidia-driver"; then
    echo ""
    echo "🔁 Se detectó instalación o actualización de drivers NVIDIA."
    echo "💡 Reiniciando el sistema en 10 segundos..."
    sleep 10
    reboot
  else
    echo "✅ Setup finalizado sin instalación de drivers NVIDIA."
  fi
fi
