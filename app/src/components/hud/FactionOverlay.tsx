// FactionOverlay — draws era-keyed faction territory zones as translucent
// SVG ellipses over the galaxy canvas. Each zone maps to a broad galactic
// region (not individual planets) based on canon political geography.

import type { EraId } from '../../types/lore'
import type { Lang } from '../../lib/lore'

interface Zone {
  id: string
  label: { en: string; tr: string }
  // position as % of the overlay div (0-100)
  cx: number
  cy: number
  rx: number
  ry: number
  rotation: number
  color: string
  eras: EraId[]
}

// These zones represent broad political spheres of influence across galactic
// regions. Positions are calibrated to match the three-ring galaxy disk
// layout of GalaxyEngine (core = center, outer rim = edges).
const ZONES: Zone[] = [
  // ── CLONE WARS ERA ────────────────────────────────────────────────────────
  {
    id: 'republic-clone-wars',
    label: { en: 'Galactic Republic', tr: 'Galaktik Cumhuriyet' },
    cx: 50, cy: 50, rx: 28, ry: 28, rotation: 0,
    color: '#3B82F6',
    eras: ['clone-wars'],
  },
  {
    id: 'separatist-cis',
    label: { en: 'Confederacy of Independent Systems', tr: 'Bağımsız Sistemler Konfederasyonu' },
    cx: 72, cy: 62, rx: 22, ry: 16, rotation: -20,
    color: '#EF4444',
    eras: ['clone-wars'],
  },
  {
    id: 'hutt-space-cw',
    label: { en: 'Hutt Space', tr: 'Hutt Uzayı' },
    cx: 66, cy: 40, rx: 14, ry: 10, rotation: 15,
    color: '#A855F7',
    eras: ['clone-wars', 'empire'],
  },
  // ── EMPIRE ERA ────────────────────────────────────────────────────────────
  {
    id: 'galactic-empire',
    label: { en: 'Galactic Empire', tr: 'Galaktik İmparatorluk' },
    cx: 50, cy: 50, rx: 32, ry: 32, rotation: 0,
    color: '#6B7280',
    eras: ['empire'],
  },
  {
    id: 'rebel-territory',
    label: { en: 'Rebel Alliance', tr: 'Asi İttifakı' },
    cx: 78, cy: 68, rx: 10, ry: 7, rotation: -10,
    color: '#F97316',
    eras: ['empire'],
  },
  {
    id: 'mandalore-empire',
    label: { en: 'Mandalorian Space', tr: 'Mandaloryalı Uzayı' },
    cx: 42, cy: 28, rx: 8, ry: 6, rotation: 5,
    color: '#14B8A6',
    eras: ['empire', 'new-republic'],
  },
  // ── NEW REPUBLIC ERA ──────────────────────────────────────────────────────
  {
    id: 'new-republic',
    label: { en: 'New Republic', tr: 'Yeni Cumhuriyet' },
    cx: 48, cy: 50, rx: 26, ry: 26, rotation: 0,
    color: '#22C55E',
    eras: ['new-republic'],
  },
  {
    id: 'first-order-territory',
    label: { en: 'First Order', tr: 'Birinci Düzen' },
    cx: 30, cy: 22, rx: 14, ry: 10, rotation: 12,
    color: '#DC2626',
    eras: ['new-republic'],
  },
  {
    id: 'resistance',
    label: { en: 'Resistance', tr: 'Direniş' },
    cx: 74, cy: 72, rx: 7, ry: 5, rotation: -5,
    color: '#F59E0B',
    eras: ['new-republic'],
  },
  // ── ALL ERAS ──────────────────────────────────────────────────────────────
  {
    id: 'unknown-regions-all',
    label: { en: 'Unknown Regions', tr: 'Bilinmeyen Bölgeler' },
    cx: 22, cy: 25, rx: 18, ry: 12, rotation: -30,
    color: '#475569',
    eras: ['clone-wars', 'empire', 'new-republic', 'old-republic'],
  },
]

export default function FactionOverlay({
  era,
  lang,
}: {
  era: EraId
  lang: Lang
}) {
  const visible = ZONES.filter((z) => z.eras.includes(era))

  return (
    <div className="pointer-events-none absolute inset-0 z-5">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          {visible.map((z) => (
            <radialGradient key={`grad-${z.id}`} id={`grad-${z.id}`}>
              <stop offset="0%" stopColor={z.color} stopOpacity="0.22" />
              <stop offset="70%" stopColor={z.color} stopOpacity="0.09" />
              <stop offset="100%" stopColor={z.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {visible.map((z) => (
          <g
            key={z.id}
            transform={`rotate(${z.rotation} ${z.cx} ${z.cy})`}
          >
            {/* filled territory zone */}
            <ellipse
              cx={z.cx}
              cy={z.cy}
              rx={z.rx}
              ry={z.ry}
              fill={`url(#grad-${z.id})`}
            />
            {/* border ring */}
            <ellipse
              cx={z.cx}
              cy={z.cy}
              rx={z.rx}
              ry={z.ry}
              fill="none"
              stroke={z.color}
              strokeWidth="0.3"
              strokeOpacity="0.4"
              strokeDasharray="1.2 0.8"
            />
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-1.5 rounded-lg border border-white/10 bg-black/60 p-2.5 backdrop-blur-xs">
        <div className="mb-1 font-hud text-[8px] uppercase tracking-[0.3em] text-slate-500">
          {lang === 'tr' ? 'Nüfuz Bölgeleri' : 'Territory'}
        </div>
        {visible.map((z) => (
          <div key={z.id} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: z.color, boxShadow: `0 0 4px ${z.color}` }}
            />
            <span className="font-hud text-[9px] text-slate-300">
              {z.label[lang]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
