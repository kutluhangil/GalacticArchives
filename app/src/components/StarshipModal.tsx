// Starship Dossier Modal — cinematic tactical photographic examination
// with comprehensive canon technical specifications, armaments, and pilots.

import { useEffect, useState } from 'react'
import type { Starship } from '../types/lore'
import { L } from '../lib/lore'
import Aurebesh from './Aurebesh'
import StarshipClassIcon from './StarshipClassIcon'
import ShipBlueprint from './ShipBlueprint'
import SourceLink from './SourceLink'

interface Props {
  starship: Starship | null
  onClose: () => void
  lang: 'en' | 'tr'
}

export default function StarshipModal({ starship, onClose, lang }: Props) {
  const [viewMode, setViewMode] = useState<'photo' | 'blueprint'>('photo')

  useEffect(() => {
    if (!starship) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [starship, onClose])

  if (!starship) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ship-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-holo-cyan/40 bg-panel/95 shadow-[0_0_50px_rgba(0,240,255,0.18)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-holo-cyan/30 bg-holo-cyan/10">
              <StarshipClassIcon
                starshipClass={starship.starshipClass?.en}
                className="h-5 w-5 text-holo-cyan"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="ship-modal-title"
                  className="font-display text-lg sm:text-xl tracking-wide text-slate-100"
                >
                  {L(starship.names, lang)}
                </h2>
                <Aurebesh text={starship.model} className="hidden sm:inline-block text-[10px] text-holo-cyan/60" />
              </div>
              <div className="text-[11px] text-slate-400">
                {starship.model} · <span className="text-holo-cyan">{L(starship.starshipClass, lang)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Tactical Visual Showcase with Mode Switcher */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-hud text-xs uppercase tracking-widest text-slate-300">
                  {lang === 'tr' ? '📸 Taktik Görsel İnceleme' : '📸 Tactical Visual Examination'}
                </span>
                <span className="hidden sm:inline rounded border border-holo-cyan/30 bg-holo-cyan/10 px-1.5 py-0.5 font-hud text-[9px] uppercase tracking-wider text-holo-cyan">
                  {lang === 'tr' ? 'Kanonik Fotoğraf' : 'Canon Photography'}
                </span>
              </div>

              {/* View Switcher: Photo / Blueprint */}
              <div className="flex items-center rounded-lg border border-white/10 bg-black/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('photo')}
                  className={`rounded px-2.5 py-1 font-hud text-[10px] uppercase tracking-wider transition-colors ${
                    viewMode === 'photo'
                      ? 'border border-holo-cyan/40 bg-holo-cyan/20 text-holo-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📸 {lang === 'tr' ? 'Fotoğraf' : 'Photo'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('blueprint')}
                  className={`rounded px-2.5 py-1 font-hud text-[10px] uppercase tracking-wider transition-colors ${
                    viewMode === 'blueprint'
                      ? 'border border-holo-cyan/40 bg-holo-cyan/20 text-holo-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📐 {lang === 'tr' ? 'Şema' : 'Blueprint'}
                </button>
              </div>
            </div>

            {viewMode === 'photo' ? (
              <div className="group relative aspect-16/9 w-full overflow-hidden rounded-xl border border-white/15 bg-black/80 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <img
                  src={`/ships/${starship.id}.webp`}
                  alt={L(starship.names, lang)}
                  width={800}
                  height={450}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />

                {/* Tactical HUD Overlays */}
                <div className="pointer-events-none absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-black/60" />

                {/* Top Overlay Badge */}
                <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded border border-holo-cyan/30 bg-black/70 px-2.5 py-1 font-hud text-[10px] text-holo-cyan backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-holo-cyan animate-pulse" />
                  <span>{starship.model}</span>
                </div>

                <div className="pointer-events-none absolute top-3 right-3 rounded border border-star-gold/40 bg-black/70 px-2.5 py-1 font-hud text-[11px] text-star-gold backdrop-blur-md">
                  📏 {starship.lengthMeters?.toLocaleString()}m
                </div>

                {/* Bottom Overlay Telemetry */}
                <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-hud text-slate-300">
                  <div className="rounded border border-white/10 bg-black/75 px-2.5 py-1 backdrop-blur-md">
                    <span className="text-slate-400">{lang === 'tr' ? 'ÜRETİCİ:' : 'MFG:'} </span>
                    <span className="text-slate-200">{L(starship.manufacturer, lang)}</span>
                  </div>

                  {starship.sublightMGLT && (
                    <div className="rounded border border-holo-cyan/20 bg-black/75 px-2.5 py-1 text-holo-cyan backdrop-blur-md">
                      ⚡ {starship.sublightMGLT} MGLT
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-holo-cyan/30 bg-black/70 p-4">
                <ShipBlueprint shipId={starship.id} lang={lang} />
              </div>
            )}
          </div>

          {/* Archive Summary & Lore */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="mb-1 font-hud text-[10px] uppercase tracking-wider text-slate-500">
              {lang === 'tr' ? 'Arşiv Özeti & Tarihçe' : 'Archive Summary & History'}
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {L(starship.desc, lang)}
            </p>
          </div>

          {/* Detailed Technical Specs Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Speed & Propulsion */}
            <div className="rounded-xl border border-holo-cyan/20 bg-black/30 p-4">
              <div className="mb-2.5 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-holo-cyan">
                <span>⚡</span>
                <span>{lang === 'tr' ? 'Hız ve Tahrik' : 'Speed & Propulsion'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Azami Hız:' : 'Max Speed:'}</span>
                  <span className="font-medium text-slate-200">{starship.maxSpeed ?? '—'}</span>
                </div>
                {starship.sublightMGLT && (
                  <div>
                    <span className="text-slate-500 block">{lang === 'tr' ? 'Alt-Işık Hızı:' : 'Sublight Speed:'}</span>
                    <span className="font-medium text-star-gold">{starship.sublightMGLT} MGLT</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Hiperürücü Sınıfı:' : 'Hyperdrive Rating:'}</span>
                  <span className="font-medium text-slate-200">{starship.hyperdriveRating ?? '—'}</span>
                </div>
                {starship.engineSystems && (
                  <div>
                    <span className="text-slate-500 block">{lang === 'tr' ? 'Motor Sistemleri:' : 'Engine Systems:'}</span>
                    <span className="font-medium text-slate-300">{starship.engineSystems}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Defense & Armament */}
            <div className="rounded-xl border border-red-500/20 bg-black/30 p-4">
              <div className="mb-2.5 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-red-400">
                <span>🛡️</span>
                <span>{lang === 'tr' ? 'Savunma ve Silahlar' : 'Defense & Armament'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Kalkanlar ve Zırh:' : 'Shields & Armor:'}</span>
                  <span className="font-medium text-slate-200">
                    {starship.shieldsAndArmor ? L(starship.shieldsAndArmor, lang) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Silah Donanımı:' : 'Armament:'}</span>
                  <span className="font-medium text-slate-200">
                    {starship.armament ? L(starship.armament, lang) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Crew & Notable Pilots */}
            <div className="rounded-xl border border-star-gold/20 bg-black/30 p-4">
              <div className="mb-2.5 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-star-gold">
                <span>👤</span>
                <span>{lang === 'tr' ? 'Mürettebat ve Pilotlar' : 'Crew & Pilots'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Önemli Pilotlar / Komutanlar:' : 'Notable Pilots / Commanders:'}</span>
                  <span className="font-medium text-star-gold">
                    {starship.notablePilots ? L(starship.notablePilots, lang) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Mürettebat:' : 'Crew:'}</span>
                  <span className="font-medium text-slate-200">{starship.crew ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Yolcu Kapasitesi:' : 'Passengers:'}</span>
                  <span className="font-medium text-slate-200">{starship.passengers ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Production & Scale */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="mb-2.5 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-slate-400">
                <span>⚙️</span>
                <span>{lang === 'tr' ? 'Üretim ve Boyut' : 'Production & Scale'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Üretim Yılı / Dönem:' : 'Built Year:'}</span>
                  <span className="font-medium text-slate-200">{starship.builtYear ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Üretici:' : 'Manufacturer:'}</span>
                  <span className="font-medium text-slate-200">{L(starship.manufacturer, lang)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Uzunluk:' : 'Length:'}</span>
                  <span className="font-medium text-slate-200">{starship.lengthMeters?.toLocaleString()} metre</span>
                </div>
              </div>
            </div>

            {/* Logistics & Cargo */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="mb-2.5 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-slate-400">
                <span>📦</span>
                <span>{lang === 'tr' ? 'Lojistik ve Kargo' : 'Logistics & Cargo'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'Kargo Kapasitesi:' : 'Cargo Capacity:'}</span>
                  <span className="font-medium text-slate-200">{starship.cargoCapacity ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'tr' ? 'İkmal Ömrü:' : 'Consumables:'}</span>
                  <span className="font-medium text-slate-200">{starship.consumables ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Appearances */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="mb-2.5 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-slate-400">
                <span>🎬</span>
                <span>{lang === 'tr' ? 'Göründüğü Yapımlar' : 'Appearances'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {starship.appearances?.map((app) => (
                  <span
                    key={app}
                    className="rounded border border-white/10 bg-black/50 px-2 py-0.5 font-hud text-[10px] text-slate-300"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Canonical Source Citation */}
          <div className="border-t border-white/10 pt-3">
            <SourceLink source={starship.source} />
          </div>
        </div>
      </div>
    </div>
  )
}
