# Artikeltrainer.de – Neue Plattform

Adaptives Deutschlern-System mit KI-Feedback, Elo-Rating und datenschutzkonformem anonymem Tracking.

## Projektstruktur

```
artikeltrainer/
├── backend/          # Python FastAPI Backend
│   ├── main.py       # Hauptanwendung + alle API-Endpunkte
│   ├── models.py     # Datenbankmodelle (SQLAlchemy)
│   ├── database.py   # DB-Verbindung + Init
│   ├── seed.py       # Beispieldaten (38 Übungen)
│   ├── elo.py        # Adaptiver Elo-Algorithmus
│   ├── ai_feedback.py# KI-Feedback mit Caching
│   ├── sitemap.py    # Automatische Sitemap-Generierung
│   ├── requirements.txt
│   └── .env.example
└── frontend/         # React + Vite + TailwindCSS Frontend
    ├── src/
    │   ├── App.jsx
    │   ├── api.js         # API-Client
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── AdSlot.jsx  # Google AdSense Komponente
    │   │   └── SeoHead.jsx # Dynamische Meta-Tags
    │   └── pages/
    │       ├── Home.jsx
    │       ├── Exercise.jsx
    │       └── Legal.jsx
    ├── index.html
    ├── vite.config.js
    └── .env.example
```

## Lokale Entwicklung

### Backend starten

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# .env bearbeiten und OPENAI_API_KEY eintragen
uvicorn main:app --reload --port 8000
```

API-Dokumentation: http://localhost:8000/docs

### Frontend starten

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend: http://localhost:5173

## Deployment auf DigitalOcean

### Backend (Droplet)

```bash
# Auf dem Server:
git clone <repo-url>
cd artikeltrainer/backend
pip install -r requirements.txt
cp .env.example .env
# .env mit echten Werten befüllen

# Als Systemdienst starten (systemd)
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend (Build)

```bash
cd frontend
cp .env.example .env.local
# VITE_API_URL=https://neu.artikeltrainer.de setzen
pnpm build
# dist/ Ordner auf den Server kopieren (nginx)
```

### Nginx-Konfiguration (Beispiel)

```nginx
server {
    server_name neu.artikeltrainer.de;

    # Frontend (statische Dateien)
    location / {
        root /var/www/artikeltrainer/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Sitemap + robots.txt
    location ~ ^/(sitemap.xml|robots.txt)$ {
        proxy_pass http://localhost:8000;
    }
}
```

## Umgebungsvariablen

### Backend (.env)
| Variable | Beschreibung | Pflicht |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API-Key für KI-Feedback | Nein (Fallback aktiv) |
| `ADMIN_API_KEY` | Schlüssel für Admin-Endpunkte | Ja |
| `DATABASE_URL` | DB-URL (Standard: SQLite) | Nein |

### Frontend (.env.local)
| Variable | Beschreibung |
|---|---|
| `VITE_API_URL` | Backend-URL (leer = gleiche Domain) |
| `VITE_ADS_ENABLED` | Werbung an/aus (true/false) |

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/user/init` | Anonymen Nutzer erstellen/laden |
| GET | `/api/categories` | Alle Kategorien |
| POST | `/api/exercise/next` | Nächste adaptive Aufgabe |
| POST | `/api/exercise/answer` | Antwort einreichen + Feedback |
| GET | `/api/user/stats/{token}` | Nutzerstatistiken |
| GET | `/api/admin/drafts` | Unveröffentlichte Aufgaben |
| POST | `/api/admin/approve/{id}` | Aufgabe freigeben |
| GET | `/sitemap.xml` | Automatische Sitemap |
| GET | `/robots.txt` | robots.txt |

## Monetarisierung

- **Google AdSense**: Publisher-ID `ca-pub-2754627178063569` bereits eingebunden
- Ad-Slots in `AdSlot.jsx` konfigurieren (Slot-IDs aus AdSense-Dashboard)
- Werbung via `VITE_ADS_ENABLED=false` deaktivieren (z.B. für Premium-Nutzer)
