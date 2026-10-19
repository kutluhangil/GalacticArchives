// Arsenal Dossier Modal — Galactic Weaponry, Armor & Superweapons
// Detailed technical schematics, yield ratings, combat telemetry, and canonical history.

import { useEffect } from 'react'
import type { ArsenalItem } from '../types/lore'
import { L } from '../lib/lore'
import Aurebesh from './Aurebesh'
import SourceLink from './SourceLink'

interface Props {
  item: ArsenalItem | null
  onClose: () => void
  lang: 'en' | 'tr'
}

export default function ArsenalModal({ item, onClose, lang }: Props) {
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, onClose])

  if (!item) return null

  const categoryColorMap = {
    'blaster': 'text-red-400 border-red-500/30 bg-red-500/10',
    'heavy-weapon': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    'melee-exotic': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    'material-armor': 'text-star-gold border-star-gold/30 bg-star-gold/10',
    'superweapon': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  }[item.category]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="arsenal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-holo-cyan/40 bg-panel/95 shadow-[0_0_50px_rgba(0,240,255,0.18)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-holo-cyan/30 bg-holo-cyan/10 text-xl">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="arsenal-modal-title"
                  className="font-display text-lg sm:text-xl tracking-wide text-slate-100"
                >
                  {L(item.names, lang)}
                </h2>
                <Aurebesh text={item.id} className="hidden sm:inline-block text-[10px] text-holo-cyan/60" />
              </div>
              <div className="text-[11px] text-slate-400">
                {L(item.categoryName, lang)} ·{' '}
                <span className="text-holo-cyan">{L(item.manufacturerOrOrigin, lang)}</span>
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
          {/* Tactical Visual Showcase */}
          <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl border border-white/15 bg-black/80 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <img
              src={`/arsenal/${item.id}.webp`}
              alt={L(item.names, lang)}
              width={800}
              height={450}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Tactical Overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className={`rounded border px-2 py-0.5 font-hud text-[9px] uppercase tracking-wider backdrop-blur-xs ${categoryColorMap}`}>
                {L(item.categoryName, lang)}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-hud text-slate-300">
              <div className="rounded border border-white/10 bg-black/75 px-2.5 py-1 backdrop-blur-md">
                <span className="text-slate-400">{lang === 'tr' ? 'MENZİL / VERİM:' : 'RANGE / YIELD:'} </span>
                <span className="text-star-gold">{L(item.rangeYield, lang)}</span>
              </div>
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                  {lang === 'tr' ? 'Üretici / Menşe' : 'Manufacturer / Origin'}
                </span>
                <span className="mt-0.5 block font-medium text-slate-200">
                  {L(item.manufacturerOrOrigin, lang)}
                </span>
              </div>
              <div>
                <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                  {lang === 'tr' ? 'Başlıca Kullanıcılar' : 'Primary Users'}
                </span>
                <span className="mt-0.5 block font-medium text-slate-200">
                  {L(item.primaryUsers, lang)}
                </span>
              </div>
            </div>

            <div className="border-t border-white/8 pt-3">
              <span className="font-hud text-[10px] uppercase tracking-wider text-holo-cyan block">
                {lang === 'tr' ? 'Teknik Özellikler & Yapı' : 'Technical Specifications & Architecture'}
              </span>
              <span className="mt-0.5 block text-slate-200 leading-relaxed font-medium">
                {L(item.technicalSpecs, lang)}
              </span>
            </div>
          </div>

          {/* Lore & Historical Dossier */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="mb-1.5 font-hud text-[10px] uppercase tracking-wider text-slate-500">
              {lang === 'tr' ? 'Taktik Analiz & Tarihçe' : 'Tactical Analysis & Lore'}
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {L(item.desc, lang)}
            </p>
          </div>

          {/* Appearances */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-slate-400">
              <span>🎬</span>
              <span>{lang === 'tr' ? 'Göründüğü Yapımlar' : 'Appearances'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {item.appearances.map((app) => (
                <span
                  key={app}
                  className="rounded border border-white/10 bg-black/50 px-2 py-0.5 font-hud text-[10px] text-slate-300"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>

          {/* Citation Link */}
          <div className="border-t border-white/10 pt-3">
            <SourceLink source={item.source} />
          </div>
        </div>
      </div>
    </div>
  )
}
