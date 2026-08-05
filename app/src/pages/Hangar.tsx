// Starship Hangar — full-featured hangar page with blueprint viewer,
// era/faction filters, and scale comparison bar.

import { useState, useMemo } from 'react'
import TopBar from '../components/hud/TopBar'
import ShipBlueprint from '../components/ShipBlueprint'
import { useApp } from '../state/app'
import { factionById, L } from '../lib/lore'
import { sfx } from '../lib/audio'
import SourceLink from '../components/SourceLink'
import starshipsData from '../data/starships.json'
import type { Starship } from '../types/lore'

type LangKey = 'en' | 'tr'

const ships = starshipsData as Starship[]

const ERA_LABEL: Record<string, { en: string; tr: string }> = {
  'clone-wars': { en: 'Clone Wars', tr: 'Klon Savaşları' },
  empire: { en: 'Galactic Empire', tr: 'Galaktik İmparatorluk' },
  'new-republic': { en: 'New Republic', tr: 'Yeni Cumhuriyet' },
}

const CLASS_ICONS: Record<string, string> = {
  Starfighter: '✈',
  'Light Freighter': '🚛',
  'Capital Ship / Star Destroyer': '⛴',
  'Super Star Destroyer': '🛸',
  'Star Cruiser / Carrier': '🚢',
  'Corvette / Blockade Runner': '⛵',
  'Gunship / Transport': '🚁',
  'Patrol & Attack Craft': '🔫',
  'Interceptor Starfighter': '🏹',
}

// Maximum ship length for scale bar (the Executor at 19,000m)
const MAX_LENGTH = 19000

export default function Hangar() {
  const lang = useApp((s) => s.lang) as LangKey
  const era = useApp((s) => s.era)
  const [eraFilter, setEraFilter] = useState<string>('all')
  const [selectedShip, setSelectedShip] = useState<Starship>(ships[0])
  const [blueprintOpen, setBlueprintOpen] = useState(false)

  const filtered = useMemo(() => {
    if (eraFilter === 'all') return ships
    return ships.filter((s) => s.affiliationsByEra && eraFilter in s.affiliationsByEra)
  }, [eraFilter])

  const faction = factionById(selectedShip.affiliationsByEra?.[era])

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-space pb-24">
      <TopBar />

      <div className="mx-auto max-w-6xl px-4 pt-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl tracking-[0.25em] text-slate-100">
            {lang === 'tr' ? '🛸 YILDIZ GEMİSİ HANGARI' : '🛸 STARSHIP HANGAR'}
          </h1>
          <p className="mt-1 font-hud text-xs text-slate-400">
            {lang === 'tr'
              ? 'Teknik Şemalar, Bileşen Analizleri ve Boyut Karşılaştırmaları'
              : 'Technical Schematics, Component Analysis & Scale Comparisons'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar: ship list + era filter */}
          <div>
            {/* Era filter */}
            <div className="mb-3 flex flex-wrap gap-1 rounded border border-white/10 bg-black/40 p-0.5">
              {['all', 'clone-wars', 'empire', 'new-republic'].map((e) => (
                <button
                  key={e}
                  onClick={() => setEraFilter(e)}
                  className={`rounded px-2 py-1 font-hud text-[9px] uppercase tracking-wider transition-all ${
                    eraFilter === e
                      ? 'bg-star-gold/20 text-star-gold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {e === 'all' ? (lang === 'tr' ? 'Hepsi' : 'All') : ERA_LABEL[e][lang]}
                </button>
              ))}
            </div>

            {/* Ship list */}
            <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filtered.map((ship) => {
                const shipFaction = factionById(ship.affiliationsByEra?.[era])
                return (
                  <button
                    key={ship.id}
                    onClick={() => {
                      sfx.playSelect()
                      setSelectedShip(ship)
                      setBlueprintOpen(false)
                    }}
                    className={`block w-full rounded border px-3 py-2.5 text-left transition-all ${
                      selectedShip.id === ship.id
                        ? 'border-holo-cyan/50 bg-holo-cyan/10'
                        : 'border-white/8 bg-black/30 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[12px] tracking-wide text-slate-100">
                        {CLASS_ICONS[ship.starshipClass?.en ?? ''] ?? '🚀'} {L(ship.names, lang)}
                      </span>
                      {shipFaction && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: shipFaction.color }}
                        />
                      )}
                    </div>
                    <div className="mt-0.5 font-hud text-[9px] text-slate-500">
                      {ship.model} · {ship.lengthMeters}m
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main panel: selected ship */}
          <div>
            {/* Ship header */}
            <div className="rounded-xl border border-white/10 bg-panel/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl tracking-[0.15em] text-slate-100">
                    {L(selectedShip.names, lang)}
                  </h2>
                  <div className="mt-1 font-hud text-xs text-slate-400">{selectedShip.model}</div>
                  {faction && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded border border-white/10 bg-black/30 px-2.5 py-1 text-[11px]">
                      <span className="h-2 w-2 rounded-full" style={{ background: faction.color }} />
                      <span className="text-slate-300">{L(faction.names, lang)}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setBlueprintOpen(!blueprintOpen)}
                  className={`rounded border px-3 py-1.5 font-hud text-[10px] uppercase tracking-wider transition-all ${
                    blueprintOpen
                      ? 'border-holo-cyan/60 bg-holo-cyan/20 text-holo-cyan'
                      : 'border-white/20 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {blueprintOpen
                    ? (lang === 'tr' ? '✕ Şemayı Kapat' : '✕ Close Blueprint')
                    : (lang === 'tr' ? '📐 Şema Görüntüle' : '📐 View Blueprint')}
                </button>
              </div>

              {/* Blueprint */}
              {blueprintOpen && (
                <div className="mt-4">
                  <ShipBlueprint shipId={selectedShip.id} lang={lang} />
                </div>
              )}

              {/* Description */}
              <p className="mt-4 text-[13px] leading-relaxed text-slate-300">
                {L(selectedShip.desc, lang)}
              </p>

              {/* Stats grid */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  {
                    label: { en: 'Length', tr: 'Uzunluk' },
                    value: `${selectedShip.lengthMeters?.toLocaleString()}m`,
                  },
                  {
                    label: { en: 'Hyperdrive', tr: 'Hiperürücü' },
                    value: selectedShip.hyperdriveRating,
                  },
                  {
                    label: { en: 'Crew', tr: 'Mürettebat' },
                    value: selectedShip.crew,
                  },
                  {
                    label: { en: 'Passengers', tr: 'Yolcu' },
                    value: selectedShip.passengers,
                  },
                  {
                    label: { en: 'Manufacturer', tr: 'Üretici' },
                    value: L(selectedShip.manufacturer, lang),
                  },
                  {
                    label: { en: 'Ship Class', tr: 'Gemi Sınıfı' },
                    value: L(selectedShip.starshipClass, lang),
                  },
                ].map((stat) => (
                  <div key={stat.label.en} className="rounded-lg border border-white/8 bg-black/30 p-3">
                    <div className="font-hud text-[9px] uppercase tracking-wider text-slate-500">
                      {stat.label[lang]}
                    </div>
                    <div className="mt-1 font-hud text-[12px] text-slate-200">{stat.value ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scale comparison bar */}
            <div className="mt-4 rounded-xl border border-white/10 bg-panel/50 p-4">
              <div className="mb-3 font-hud text-[10px] uppercase tracking-[0.3em] text-slate-500">
                {lang === 'tr' ? '📏 BOYUT KARŞILAŞTIRMASI' : '📏 SCALE COMPARISON'}
              </div>
              <div className="space-y-2">
                {[...ships]
                  .sort((a, b) => (b.lengthMeters ?? 0) - (a.lengthMeters ?? 0))
                  .slice(0, 8)
                  .map((ship) => {
                    const pct = ((ship.lengthMeters ?? 1) / MAX_LENGTH) * 100
                    const isSelected = ship.id === selectedShip.id
                    return (
                      <div key={ship.id} className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            sfx.playHover()
                            setSelectedShip(ship)
                          }}
                          className={`w-36 shrink-0 truncate text-right font-hud text-[10px] transition-colors ${
                            isSelected ? 'text-holo-cyan' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {L(ship.names, lang)}
                        </button>
                        <div className="flex-1 rounded-full bg-white/5 h-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.max(pct, 0.5)}%`,
                              background: isSelected ? '#66D9FF' : '#334155',
                              boxShadow: isSelected ? '0 0 8px rgba(102,217,255,0.5)' : 'none',
                            }}
                          />
                        </div>
                        <span className="w-16 shrink-0 font-hud text-[9px] text-slate-600">
                          {ship.lengthMeters?.toLocaleString()}m
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Appearances */}
            {selectedShip.appearances?.length > 0 && (
              <div className="mt-4 rounded-xl border border-white/10 bg-panel/50 p-4">
                <div className="mb-2 font-hud text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  {lang === 'tr' ? 'Görünümler' : 'Appearances'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedShip.appearances.map((mid) => (
                    <span
                      key={mid}
                      className="rounded border border-white/10 bg-black/40 px-2 py-0.5 font-hud text-[10px] text-slate-400"
                    >
                      {mid}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <SourceLink source={selectedShip.source} className="mt-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
