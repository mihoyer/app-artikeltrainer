#!/bin/bash
# ============================================================
# Artikeltrainer – Server Setup & Deployment
# Ausführen als root auf dem DigitalOcean Droplet
# ============================================================
set -e

APP_DIR="/var/www/artikeltrainer"
DOMAIN="app.artikeltrainer.de"
REPO="https://github.com/mihoyer/app-artikeltrainer.git"

echo "======================================"
echo " Artikeltrainer Deployment startet..."
echo "======================================"

# 1. System aktualisieren
echo ""
echo "[1/8] System aktualisieren..."
apt-get update -qq
apt-get install -y -qq git curl nginx python3 python3-pip python3-venv nodejs npm certbot python3-certbot-nginx

# Node.js 20 LTS installieren falls nicht vorhanden oder zu alt
NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "  → Node.js 20 LTS wird installiert..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# pnpm installieren
npm install -g pnpm 2>/dev/null || true

echo "  → Node: $(node --version), npm: $(npm --version), pnpm: $(pnpm --version 2>/dev/null || echo 'n/a')"

# 2. Projektverzeichnis anlegen
echo ""
echo "[2/8] Projektverzeichnis anlegen..."
mkdir -p "$APP_DIR"

# 3. Code von GitHub klonen oder aktualisieren
echo ""
echo "[3/8] Code von GitHub holen..."
if [ -d "$APP_DIR/.git" ]; then
  echo "  → Repo existiert, aktualisiere..."
  cd "$APP_DIR" && git pull
else
  echo "  → Klone Repo..."
  git clone "$REPO" "$APP_DIR"
fi

# 4. Backend einrichten
echo ""
echo "[4/8] Backend (Python/FastAPI) einrichten..."
cd "$APP_DIR/backend"

# Virtuelle Umgebung
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

# .env anlegen falls nicht vorhanden
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "  ⚠️  WICHTIG: Trage deinen OpenAI API Key in $APP_DIR/backend/.env ein!"
  echo "     nano $APP_DIR/backend/.env"
fi

deactivate

# 5. Datenbank initialisieren
echo ""
echo "[5/8] Datenbank initialisieren..."
cd "$APP_DIR/backend"
source venv/bin/activate
python3 -c "from database import init_db; init_db(); print('  → Datenbank OK')"
python3 -c "
from database import SessionLocal
from models import Exercise
db = SessionLocal()
count = db.query(Exercise).count()
db.close()
if count == 0:
    import seed; seed.run()
    print('  → Seed-Daten eingespielt')
else:
    print(f'  → {count} Übungen bereits vorhanden')
" 2>/dev/null || python3 seed.py
deactivate

# 6. Frontend bauen
echo ""
echo "[6/8] Frontend bauen..."
cd "$APP_DIR/frontend"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build
echo "  → Frontend gebaut: $APP_DIR/frontend/dist/"

# 7. Systemd-Service für Backend einrichten
echo ""
echo "[7/8] Backend als Systemd-Service einrichten..."
cat > /etc/systemd/system/artikeltrainer.service << EOF
[Unit]
Description=Artikeltrainer FastAPI Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$APP_DIR/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable artikeltrainer
systemctl restart artikeltrainer
sleep 2

# Status prüfen
if systemctl is-active --quiet artikeltrainer; then
  echo "  → Backend läuft ✅"
else
  echo "  ⚠️  Backend-Fehler! Logs: journalctl -u artikeltrainer -n 20"
fi

# 8. nginx konfigurieren
echo ""
echo "[8/8] nginx konfigurieren..."
cat > /etc/nginx/sites-available/artikeltrainer << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Sicherheits-Header
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Frontend (React Build)
    root $APP_DIR/frontend/dist;
    index index.html;

    # React Router – alle Pfade auf index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30;
    }

    # Sitemap und robots.txt direkt vom Backend
    location ~ ^/(sitemap\.xml|robots\.txt)$ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
    }

    # Statische Assets cachen
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Site aktivieren
ln -sf /etc/nginx/sites-available/artikeltrainer /etc/nginx/sites-enabled/artikeltrainer

# nginx-Konfiguration testen
nginx -t && systemctl reload nginx

echo ""
echo "======================================"
echo " Setup abgeschlossen! ✅"
echo "======================================"
echo ""
echo " Nächste Schritte:"
echo " 1. OpenAI Key eintragen: nano $APP_DIR/backend/.env"
echo " 2. Backend neu starten:  systemctl restart artikeltrainer"
echo " 3. SSL einrichten:       certbot --nginx -d $DOMAIN"
echo ""
echo " Seite erreichbar unter: http://$DOMAIN"
echo " Backend-Status:         systemctl status artikeltrainer"
echo " Backend-Logs:           journalctl -u artikeltrainer -f"
echo ""
