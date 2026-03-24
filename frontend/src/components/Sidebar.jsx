import { useEffect, useRef } from 'react'

const PUBLISHER_ID = 'ca-pub-2754627178063569'
const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED !== 'false'

/**
 * Sticky Seitenleiste für Desktop (160×600 Skyscraper).
 * Wird auf Mobilgeräten (< lg) automatisch ausgeblendet.
 *
 * Props:
 *   slot  – AdSense Slot-ID
 *   side  – 'left' | 'right'
 */
export default function Sidebar({ slot = '0000000000', side = 'left' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ADS_ENABLED) return
    try {
      if (window.adsbygoogle && ref.current) {
        window.adsbygoogle.push({})
      }
    } catch (e) {}
  }, [])

  if (!ADS_ENABLED) return null

  return (
    <aside
      className={`
        hidden lg:flex flex-col items-center
        sticky top-20 self-start
        w-[160px] shrink-0
        ${side === 'right' ? 'ml-4' : 'mr-4'}
      `}
      aria-label="Werbung"
    >
      <p className="text-xs text-slate-400 mb-1">Anzeige</p>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: 'block', width: '160px', height: '600px' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format="vertical"
        data-full-width-responsive="false"
      />
    </aside>
  )
}
