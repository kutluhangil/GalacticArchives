// ShipBlueprint — SVG-based schematic with labeled clickable hotspots.
// Each ship type has a unique silhouette and component annotations.

import { useState } from 'react'
import { getBlueprint, type Hotspot } from '../lib/ship-blueprints'

type LangKey = 'en' | 'tr'

export default function ShipBlueprint({
  shipId,
  lang,
}: {
  shipId: string
  lang: LangKey
}) {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const spec = getBlueprint(shipId)

  if (!spec) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/60 p-3 text-[11px] text-slate-400">
        {lang === 'tr'
          ? 'Bu gemi için arşivde şema yok.'
          : 'The archive holds no schematic for this ship.'}
      </div>
    )
  }

  return (
    <div className="relative rounded-lg border border-white/10 bg-black/60 p-3">
      {/* The schematic is decorative: its rings answer to the mouse only, and
          every one of them has a named button in the legend below, which is the
          control a keyboard or screen reader uses. Exposing both would put the
          same hotspot in the reading order twice. */}
      <svg
        viewBox="0 0 200 200"
        className="h-48 w-full"
        style={{ filter: `drop-shadow(0 0 12px ${spec.color}40)` }}
        aria-hidden="true"
        focusable="false"
      >
        {/* Grid lines */}
        {[40, 80, 120, 160].map((v) => (
          <g key={v}>
            <line x1={v} y1={10} x2={v} y2={190} stroke={spec.color} strokeOpacity="0.05" strokeWidth="0.5" />
            <line x1={10} y1={v} x2={190} y2={v} stroke={spec.color} strokeOpacity="0.05" strokeWidth="0.5" />
          </g>
        ))}

        {/* Ship silhouette */}
        {spec.paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={spec.color + '12'}
            stroke={spec.color}
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
        ))}

        {/* Hotspot rings */}
        {spec.hotspots.map((h) => (
          <g key={h.id}>
            <circle
              cx={h.cx}
              cy={h.cy}
              r="7"
              fill={activeHotspot?.id === h.id ? spec.color + '40' : 'transparent'}
              stroke={spec.color}
              strokeWidth="1"
              strokeOpacity="0.9"
              className="cursor-pointer"
              onClick={() => setActiveHotspot(activeHotspot?.id === h.id ? null : h)}
            />
            <circle
              cx={h.cx}
              cy={h.cy}
              r="2"
              fill={spec.color}
              className="pointer-events-none"
            />
          </g>
        ))}
      </svg>

      {/* Hotspot tooltip */}
      <div aria-live="polite">
        {activeHotspot && (
          <div
            className="mt-2 rounded border border-white/15 bg-black/80 p-3"
            style={{ borderColor: spec.color + '40' }}
          >
            <div className="mb-1 font-hud text-[10px] font-bold uppercase tracking-wider" style={{ color: spec.color }}>
              {activeHotspot.label[lang]}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">{activeHotspot.detail[lang]}</p>
          </div>
        )}
      </div>

      {/* Hotspot legend */}
      <div
        className="mt-2 flex flex-wrap gap-1.5"
        role="group"
        aria-label={lang === 'tr' ? 'Şema bölümleri' : 'Schematic components'}
      >
        {spec.hotspots.map((h) => (
          <button
            key={h.id}
            onClick={() => setActiveHotspot(activeHotspot?.id === h.id ? null : h)}
            aria-pressed={activeHotspot?.id === h.id}
            className="rounded px-1.5 py-0.5 font-hud text-[9px] transition-all"
            style={{
              color: activeHotspot?.id === h.id ? spec.color : '#6B7280',
              background: activeHotspot?.id === h.id ? spec.color + '15' : 'transparent',
            }}
          >
            ◉ {h.label[lang]}
          </button>
        ))}
      </div>
    </div>
  )
}
