// FactionOverlay — Tactical Holographic War Room overlay for Galactic Archives.
// Renders era-keyed faction territory influence zones, military telemetry, and
// strategic operational dossiers over the Galaxy 3D map.

import { useState } from 'react'
import type { EraId } from '../../types/lore'
import { eras, L, LL, territories, type Lang } from '../../lib/lore'

interface FactionOverlayProps {
  era: EraId
  lang: Lang
  onSelectPlanet?: (planetId: string) => void
}

function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export default function FactionOverlay({ era, lang, onSelectPlanet }: FactionOverlayProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [minimized, setMinimized] = useState<boolean>(false)

  const activeZones = territories.filter((z) => z.era === era)
  const currentEra = eras.find((e) => e.id === era)
  const selectedZone = activeZones.find((z) => z.id === selectedZoneId) ?? activeZones[0] ?? null

  return (
    <div className="pointer-events-none absolute inset-0 z-5 select-none overflow-hidden">
      {/* ── 1. Tactical Holographic Grid & Sector Rings ─────────────────── */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          {activeZones.map((z) => (
            <radialGradient key={`grad-${z.id}`} id={`grad-${z.id}`}>
              <stop offset="0%" stopColor={z.color} stopOpacity="0.32" />
              <stop offset="65%" stopColor={z.color} stopOpacity="0.14" />
              <stop offset="100%" stopColor={z.color} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id="capital-glow">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tactical Crosshair / Galaxy Coordinate Grids */}
        <g stroke="rgba(56, 189, 248, 0.08)" strokeWidth="0.15">
          <line x1="50" y1="5" x2="50" y2="95" strokeDasharray="1 1.5" />
          <line x1="5" y1="50" x2="95" y2="50" strokeDasharray="1 1.5" />
          <circle cx="50" cy="50" r="14" fill="none" strokeDasharray="1 2" />
          <circle cx="50" cy="50" r="28" fill="none" strokeDasharray="1.5 2.5" />
          <circle cx="50" cy="50" r="42" fill="none" strokeDasharray="2 3" />
        </g>

        {/* Sector Ring Labels */}
        <g fill="rgba(56, 189, 248, 0.22)" fontSize="1.1" fontFamily="monospace" letterSpacing="0.2">
          <text x="51" y="37">CORE / 0-0-0</text>
          <text x="51" y="23">COLONIES / MID-RIM</text>
          <text x="51" y="9">OUTER RIM TERRITORIES</text>
        </g>

        {/* Faction Territory Zones */}
        {activeZones.map((z) => {
          const isSelected = selectedZone?.id === z.id
          return (
            <g
              key={z.id}
              transform={`rotate(${z.geometry.rotation} ${z.geometry.cx} ${z.geometry.cy})`}
              className="pointer-events-auto cursor-pointer transition-all duration-300"
              onClick={() => setSelectedZoneId(z.id)}
            >
              {/* Territory fill */}
              <ellipse
                cx={z.geometry.cx}
                cy={z.geometry.cy}
                rx={z.geometry.rx}
                ry={z.geometry.ry}
                fill={`url(#grad-${z.id})`}
                className="transition-opacity duration-300 hover:opacity-100"
                style={{ opacity: isSelected ? 1 : 0.75 }}
              />

              {/* Outer boundary line */}
              <ellipse
                cx={z.geometry.cx}
                cy={z.geometry.cy}
                rx={z.geometry.rx}
                ry={z.geometry.ry}
                fill="none"
                stroke={z.color}
                strokeWidth={isSelected ? '0.45' : '0.25'}
                strokeOpacity={isSelected ? '0.9' : '0.55'}
                strokeDasharray={isSelected ? '2 1' : '1.5 1'}
              />

              {/* Capital Beacon Marker */}
              <g transform={`rotate(${-z.geometry.rotation} ${z.geometry.cx} ${z.geometry.cy})`}>
                <circle
                  cx={z.geometry.cx}
                  cy={z.geometry.cy}
                  r="0.7"
                  fill={z.color}
                  stroke="#ffffff"
                  strokeWidth="0.15"
                />
                <circle
                  cx={z.geometry.cx}
                  cy={z.geometry.cy}
                  r="1.5"
                  fill="none"
                  stroke={z.color}
                  strokeWidth="0.1"
                  strokeOpacity="0.6"
                />
                <text
                  x={z.geometry.cx}
                  y={z.geometry.cy - 1.5}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize="1.15"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="0.1"
                  style={{ textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
                >
                  {L(z.shortName, lang).toUpperCase()}
                </text>
              </g>
            </g>
          )
        })}
      </svg>

      {/* ── 2. Strategic Tactical War Room HUD ───────────────────────────── */}
      <div className="pointer-events-auto absolute bottom-16 right-4 z-20 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-xl border border-holo-cyan/30 bg-space-dark/90 p-3 shadow-2xl backdrop-blur-md">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 animate-ping rounded-full bg-holo-cyan" />
            <span className="font-hud text-[10px] tracking-[0.25em] text-holo-cyan uppercase">
              {lang === 'tr' ? 'Harekât Hareketi' : 'War Room Intel'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-slate-400">
              {currentEra ? L(currentEra.names, lang) : era}
            </span>
            <button
              onClick={() => setMinimized(!minimized)}
              className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-white/10 hover:text-white"
              title={minimized ? (lang === 'tr' ? 'Genişlet' : 'Expand') : (lang === 'tr' ? 'Küçült' : 'Minimize')}
            >
              {minimized ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Galactic Territory Balance Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>{lang === 'tr' ? 'Hakimiyet Dağılımı' : 'Territory Control'}</span>
            <span className="font-mono text-holo-cyan">100%</span>
          </div>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            {activeZones.map((z) => (
              <div
                key={`bar-${z.id}`}
                style={{ width: `${z.controlPercent}%`, backgroundColor: z.color }}
                className="h-full transition-all duration-300"
                title={`${L(z.shortName, lang)}: ${z.controlPercent}%`}
              />
            ))}
          </div>
        </div>

        {/* Faction Quick Selector Chips */}
        <div className="flex flex-wrap gap-1">
          {activeZones.map((z) => {
            const isSel = selectedZone?.id === z.id
            return (
              <button
                key={z.id}
                onClick={() => setSelectedZoneId(z.id)}
                className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[9.5px] transition-all ${
                  isSel
                    ? 'border-holo-cyan bg-holo-cyan/20 text-white font-medium shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                    : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: z.color, boxShadow: `0 0 4px ${z.color}` }}
                />
                <span>{L(z.shortName, lang)}</span>
                <span className="font-mono text-[8px] text-slate-500">{z.controlPercent}%</span>
              </button>
            )
          })}
        </div>

        {/* Detailed Faction War Dossier (when not minimized) */}
        {!minimized && selectedZone && (
          <div className="mt-1 flex flex-col gap-2 rounded-lg border border-white/5 bg-black/50 p-2.5 text-[11px] animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-hud text-[11px] font-semibold text-white tracking-wide">
                  {L(selectedZone.name, lang)}
                </h4>
                <p className="text-[9.5px] text-slate-400">
                  {lang === 'tr' ? 'Liderlik:' : 'Leadership:'}{' '}
                  <span className="text-slate-200">{L(selectedZone.leader, lang)}</span>
                </p>
              </div>
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                style={{ backgroundColor: `${selectedZone.color}22`, color: selectedZone.color }}
              >
                %{selectedZone.controlPercent}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[9px] border-t border-b border-white/5 py-1.5">
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px]">
                  {lang === 'tr' ? 'Başkent / Koordinat' : 'Capital / Grid'}
                </span>
                <span className="text-slate-200 font-mono">
                  {L(selectedZone.capital, lang)} ({selectedZone.capitalCoordinates ?? '—'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px]">
                  {lang === 'tr' ? 'Askeri Varlık' : 'Military Power'}
                </span>
                <span className="text-slate-300 line-clamp-1" title={L(selectedZone.militaryPower, lang)}>
                  {L(selectedZone.militaryPower, lang)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[8px]">
                {lang === 'tr' ? 'Askeri Doktrin' : 'Operational Doctrine'}
              </span>
              <p className="text-[9.5px] text-slate-300 italic leading-snug">
                "{L(selectedZone.doctrine, lang)}"
              </p>
            </div>

            {/* Key Star Systems */}
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1">
                {lang === 'tr' ? 'Kilit Sistemler' : 'Key Systems'}
              </span>
              <div className="flex flex-wrap gap-1">
                {LL(selectedZone.keySystems, lang).map((sys) => {
                  const targetId = nameToId(sys)
                  return (
                    <button
                      key={sys}
                      onClick={() => onSelectPlanet?.(targetId)}
                      className="group flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[8.5px] text-slate-300 hover:bg-holo-cyan/20 hover:text-holo-cyan transition-colors"
                      title={lang === 'tr' ? `${sys} sistemine odaklan` : `Jump to ${sys}`}
                    >
                      <span>⊙</span>
                      <span>{sys}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
