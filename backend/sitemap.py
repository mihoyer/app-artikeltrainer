"""
Automatische Sitemap-Generierung.
Wird vom FastAPI-Hauptprozess als Endpunkt eingebunden.
"""
from fastapi import Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import date

BASE_URL = "https://neu.artikeltrainer.de"

STATIC_URLS = [
    {"loc": "/", "priority": "1.0", "changefreq": "weekly"},
    {"loc": "/ueben", "priority": "0.9", "changefreq": "daily"},
    {"loc": "/ueben/artikel", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/ueben/wortschatz", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/ueben/grammatik", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/impressum", "priority": "0.2", "changefreq": "yearly"},
    {"loc": "/datenschutz", "priority": "0.2", "changefreq": "yearly"},
]


def generate_sitemap() -> str:
    today = date.today().isoformat()
    urls = []

    for u in STATIC_URLS:
        urls.append(f"""  <url>
    <loc>{BASE_URL}{u['loc']}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{u['changefreq']}</changefreq>
    <priority>{u['priority']}</priority>
  </url>""")

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""
