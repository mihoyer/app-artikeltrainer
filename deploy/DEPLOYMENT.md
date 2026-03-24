# Deployment-Anleitung – app.artikeltrainer.de

## Voraussetzungen

- DigitalOcean Droplet mit Ubuntu 22.04 (IP: 209.38.208.199)
- DNS: `app.artikeltrainer.de` zeigt auf 209.38.208.199 ✅
- GitHub-Repo: `mihoyer/app-artikeltrainer` mit dem Projektcode

---

## Schritt 1: Code auf GitHub pushen

Bevor du den Server einrichtest, muss der Code auf GitHub sein.

```bash
# Lokal auf deinem Rechner (einmalig):
cd artikeltrainer/
git init
git remote add origin https://github.com/mihoyer/app-artikeltrainer.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## Schritt 2: DigitalOcean Webkonsole öffnen

1. Gehe zu [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Wähle dein Droplet → **Access** → **Launch Droplet Console**
3. Melde dich als `root` an

---

## Schritt 3: Setup-Skript ausführen

Kopiere diesen **einen Befehl** in die Konsole und drücke Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/mihoyer/app-artikeltrainer/main/deploy/setup_server.sh | bash
```

Das Skript erledigt automatisch:
- System-Updates und alle Abhängigkeiten installieren
- Code von GitHub klonen
- Python-Backend (FastAPI) einrichten und starten
- Datenbank initialisieren mit Beispielaufgaben
- React-Frontend bauen
- nginx konfigurieren
- Backend als Systemd-Service einrichten (startet automatisch nach Neustart)

**Dauer: ca. 3–5 Minuten**

---

## Schritt 4: OpenAI API Key eintragen

Nach dem Setup **muss** der OpenAI Key eingetragen werden:

```bash
nano /var/www/artikeltrainer/backend/.env
```

Trage ein:
```
OPENAI_API_KEY=sk-dein-key-hier
ADMIN_API_KEY=ein-sicheres-passwort-fuer-admin
SECRET_KEY=ein-langer-zufaelliger-string
```

Speichern mit `Ctrl+O`, `Enter`, `Ctrl+X`.

Dann Backend neu starten:
```bash
systemctl restart artikeltrainer
```

---

## Schritt 5: SSL-Zertifikat einrichten (HTTPS)

```bash
certbot --nginx -d app.artikeltrainer.de
```

Folge den Anweisungen (E-Mail eingeben, Bedingungen akzeptieren).  
Certbot richtet HTTPS automatisch ein und erneuert das Zertifikat automatisch.

---

## Schritt 6: Testen

```bash
# Backend-Status prüfen
systemctl status artikeltrainer

# Backend-Logs live verfolgen
journalctl -u artikeltrainer -f

# API direkt testen
curl http://localhost:8001/api/categories
```

Dann im Browser öffnen: **https://app.artikeltrainer.de**

---

## Spätere Updates (wenn neuer Code auf GitHub)

```bash
bash /var/www/artikeltrainer/deploy/update.sh
```

---

## Wichtige Pfade auf dem Server

| Was | Pfad |
| :--- | :--- |
| Projektverzeichnis | `/var/www/artikeltrainer/` |
| Backend | `/var/www/artikeltrainer/backend/` |
| Frontend (gebaut) | `/var/www/artikeltrainer/frontend/dist/` |
| Umgebungsvariablen | `/var/www/artikeltrainer/backend/.env` |
| Datenbank | `/var/www/artikeltrainer/backend/artikeltrainer.db` |
| nginx-Config | `/etc/nginx/sites-available/artikeltrainer` |
| Systemd-Service | `/etc/systemd/system/artikeltrainer.service` |

---

## Fehlerbehebung

**Backend startet nicht:**
```bash
journalctl -u artikeltrainer -n 50
```

**nginx-Fehler:**
```bash
nginx -t
journalctl -u nginx -n 20
```

**Frontend zeigt alten Stand:**
```bash
cd /var/www/artikeltrainer/frontend && pnpm build
```

**Datenbank zurücksetzen:**
```bash
cd /var/www/artikeltrainer/backend
source venv/bin/activate
rm -f artikeltrainer.db
python3 -c "from database import init_db; init_db()"
python3 seed.py
systemctl restart artikeltrainer
```
