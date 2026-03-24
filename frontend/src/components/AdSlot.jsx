import { useEffect, useRef } from 'react'

// Publisher-ID aus der bestehenden Seite
const PUBLISHER_ID = 'ca-pub-2754627178063569'

// Werbung kann global deaktiviert werden (z.B. für Premium-Nutzer)
const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED !== 'false'

/**
 * Wiederverwendbarer AdSense-Slot.
 *
 * Props:
 *   slot       – AdSense Slot-ID (aus Google AdSense Dashboard)
 *   format     – 'auto' | 'rectangle' | 'horizontal' (default: 'auto')
 *   className  – zusätzliche CSS-Klassen für den Container
 *   label      – Beschriftung über der Anzeige (default: 'Anzeige')
 */
export default function AdSlot({
  slot = '0000000000',
  format = 'auto',
  className = '',
  label = 'Anzeige'
}) {
  const adRef = useRef(null)

  useEffect(() => {
    if (!ADS_ENABLED) return
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({})
      }
    } catch (e) {
      // AdSense noch nicht geladen – kein Fehler
    }
  }, [])

  if (!ADS_ENABLED) return null

  return (
    <div className={`w-full my-4 ${className}`} aria-label="Werbung">
      <p className="text-xs text-slate-400 text-center mb-1">{label}</p>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
