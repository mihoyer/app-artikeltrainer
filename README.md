# Artikeltrainer.de – Neue Plattform

Adaptives Deutschlern-System mit KI-Feedback, Elo-Rating und datenschutzkonformem anonymem Tracking.

## Projektstruktur

```
artikeltrainer/
├── backend/           # Python FastAPI Backend
│   ├── main.py        # Hauptanwendung + alle API-Endpunkte
│   ├── models.py      # Datenbankmodelle (SQLAlchemy)
│   ├── database.py    # DB-Verbindung + Init
│   ├── seed.py        # Beispieldaten (38 Übungen)
│   ├── elo.py         # Adaptiver Elo-Algorithmus
│   ├── ai_feedback.py # KI-Feedback mit Caching
│   ├── sitemap.py     # Automatische Sitemap-Generierung
│   ├── requirements.txt
│   └── .env.example
├── frontend/          # React + Vite + TailwindCSS Frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js         # API-Client
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx # Desktop-Werbeleisten
│   │   │   ├── AdSlot.jsx  # Google AdSense Komponente
│   │   │   └── SeoHead.jsx # Dynamische Meta-Tags
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Exercise.jsx
│   │       └── Legal.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── .env.example
└── deploy/            # Deployment-Skripte
    ├── setup_server.sh # Einmaliges Server-Setup
    ├── update.sh       # Schnelles Update nach Code-Änderungen
    └── DEPLOYMENT.md   # Ausführliche Anleitung
```

## Lokale Entwicklung

### Backend starten

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env bearbeiten und OPENAI_API_KEY eintragen
python3 -c "from database import init_db; init_db()"
python3 seed.py
uvicorn main:app --reload --port 8000
```

API-Dokumentation: http://localhost:8000/docs

### Frontend starten

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend: http://localhost:5173 (Proxy leitet /api/ → Port 8000)

---

## Deployment auf DigitalOcean

**→ Ausführliche Anleitung: [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md)**

### Kurzfassung (1 Befehl in der Webkonsole):

```bash
curl -fsSL https://raw.githubusercontent.com/mihoyer/app-artikeltrainer/main/deploy/setup_server.sh | bash
```

Danach OpenAI Key eintragen und SSL einrichten:

```bash
nano /var/www/artikeltrainer/backend/.env
systemctl restart artikeltrainer
certbot --nginx -d app.artikeltrainer.de
```

---

## Umgebungsvariablen

### Backend (`backend/.env`)

| Variable | Beschreibung | Pflicht |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | OpenAI API-Key für KI-Feedback | Nein (Fallback aktiv) |
| `ADMIN_API_KEY` | Schlüssel für Admin-Endpunkte | Ja |
| `SECRET_KEY` | Zufälliger String für Sicherheit | Ja |
| `DATABASE_URL` | DB-URL (Standard: SQLite) | Nein |

### Frontend (`frontend/.env.local`)

| Variable | Beschreibung |
| :--- | :--- |
| `VITE_API_URL` | Backend-URL (leer = gleiche Domain via nginx) |
| `VITE_ADS_ENABLED` | Werbung an/aus (`true`/`false`) |

---

## API-Endpunkte

| Methode | Pfad | Beschreibung |
| :--- | :--- | :--- |
| POST | `/api/user/init` | Anonymen Nutzer erstellen/laden |
| GET | `/api/categories` | Alle Kategorien |
| POST | `/api/exercise/next` | Nächste adaptive Aufgabe |
| POST | `/api/exercise/answer` | Antwort einreichen + Feedback |
| GET | `/api/user/stats/{token}` | Nutzerstatistiken |
| GET | `/api/admin/drafts` | Unveröffentlichte Aufgaben (Admin) |
| POST | `/api/admin/approve/{id}` | Aufgabe freigeben (Admin) |
| GET | `/sitemap.xml` | Automatische Sitemap |
| GET | `/robots.txt` | robots.txt |

---

## Monetarisierung

- **Google AdSense**: Publisher-ID `ca-pub-2754627178063569` bereits eingebunden
- Ad-Slot-IDs in `AdSlot.jsx` und `Sidebar.jsx` durch echte IDs aus dem AdSense-Dashboard ersetzen
- Werbung via `VITE_ADS_ENABLED=false` deaktivieren (z.B. für Premium-Nutzer)

## Spätere Updates

```bash
# Auf dem Server nach Code-Änderungen auf GitHub:
bash /var/www/artikeltrainer/deploy/update.sh
```
