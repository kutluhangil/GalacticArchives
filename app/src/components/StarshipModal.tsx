// Starship Dossier & 3D Model Modal — interactive 360-degree tactical examination
// with comprehensive canon technical specifications, armaments, and pilots.

import { useEffect } from 'react'
import type { Starship } from '../types/lore'
import { L } from '../lib/lore'
import Aurebesh from './Aurebesh'
import StarshipClassIcon from './StarshipClassIcon'
import Ship3DViewer from './Ship3DViewer'
import SourceLink from './SourceLink'

interface Props {
  starship: Starship | null
  onClose: () => void
  lang: 'en' | 'tr'
}

export default function StarshipModal({ starship, onClose, lang }: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-holo-cyan/40 bg-panel/95 shadow-[0_0_50px_rgba(0,240,255,0.15)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-black/40">
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
          {/* 3D Model Interactive Examination Viewer */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-hud text-xs uppercase tracking-widest text-slate-400">
                {lang === 'tr' ? '🛸 3D Taktik İnceleme & Döndürme' : '🛸 3D Tactical Examination & Rotation'}
              </span>
              <span className="font-hud text-[11px] text-star-gold">
                {starship.lengthMeters?.toLocaleString()}m
              </span>
            </div>
            <Ship3DViewer shipId={starship.id} shipName={L(starship.names, lang)} />
          </div>

          {/* Description */}
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

            {/* Production & Logistics */}
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

            {/* Cargo & Logistics */}
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
