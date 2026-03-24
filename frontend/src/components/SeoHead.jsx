import { useEffect } from 'react'

/**
 * Setzt dynamisch Meta-Tags für SEO und Social Sharing.
 * Funktioniert client-seitig; für vollständiges SSR später FastAPI-Templates nutzen.
 */
export default function SeoHead({
  title = 'Artikeltrainer.de – Deutsch lernen',
  description = 'Lerne Deutsch interaktiv mit adaptiven Übungen zu Artikeln, Grammatik und Wortschatz. Kostenlos, ohne Anmeldung.',
  canonical = null,
  schema = null
}) {
  useEffect(() => {
    // Title
    document.title = title

    // Description
    setMeta('name', 'description', description)

    // Open Graph
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'Artikeltrainer.de')

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonical
    }

    // Schema.org JSON-LD
    if (schema) {
      let script = document.getElementById('schema-jsonld')
      if (!script) {
        script = document.createElement('script')
        script.id = 'schema-jsonld'
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(schema)
    }
  }, [title, description, canonical, schema])

  return null
}

function setMeta(attr, name, content) {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
