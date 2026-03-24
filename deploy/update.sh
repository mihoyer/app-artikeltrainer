#!/bin/bash
# ============================================================
# Artikeltrainer – Update-Skript
# Führt ein schnelles Update aus wenn neuer Code auf GitHub ist
# Ausführen als root: bash /var/www/artikeltrainer/deploy/update.sh
# ============================================================
set -e

APP_DIR="/var/www/artikeltrainer"

echo "🔄 Artikeltrainer Update..."

# Code aktualisieren
cd "$APP_DIR"
git pull

# Backend-Abhängigkeiten aktualisieren
cd "$APP_DIR/backend"
source venv/bin/activate
pip install -r requirements.txt -q
deactivate

# Frontend neu bauen
cd "$APP_DIR/frontend"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build

# Backend neu starten
systemctl restart artikeltrainer
sleep 2

if systemctl is-active --quiet artikeltrainer; then
  echo "✅ Update abgeschlossen! Backend läuft."
else
  echo "⚠️  Backend-Fehler! Logs: journalctl -u artikeltrainer -n 20"
fi

echo "✅ Fertig!"
