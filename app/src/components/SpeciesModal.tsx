// Species Dossier Modal — Xenobiology & Sentient Species Codex
// Comprehensive canon anatomical traits, evolutionary biology, homeworld, and Force sensitivity.

import { useEffect } from 'react'
import { Link } from 'react-router'
import type { Species } from '../types/lore'
import { L } from '../lib/lore'
import Aurebesh from './Aurebesh'
import SourceLink from './SourceLink'

interface Props {
  species: Species | null
  onClose: () => void
  lang: 'en' | 'tr'
}

export default function SpeciesModal({ species, onClose, lang }: Props) {
  useEffect(() => {
    if (!species) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [species, onClose])

  if (!species) return null

  const forceSensitivityBadge = {
    rare: {
      label: lang === 'tr' ? 'Nadir Duyarlılık' : 'Rare Sensitivity',
      color: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
    },
    moderate: {
      label: lang === 'tr' ? 'Orta Düzey Duyarlılık' : 'Moderate Sensitivity',
      color: 'text-star-gold border-star-gold/30 bg-star-gold/10',
    },
    high: {
      label: lang === 'tr' ? 'Yüksek Güç Bağlantısı' : 'High Force Affinity',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    common: {
      label: lang === 'tr' ? 'Yaygın Duyarlılık' : 'Common Sensitivity',
      color: 'text-holo-cyan border-holo-cyan/30 bg-holo-cyan/10',
    },
  }[species.forceSensitivity]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="species-modal-title"
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
              🧬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="species-modal-title"
                  className="font-display text-lg sm:text-xl tracking-wide text-slate-100"
                >
                  {L(species.names, lang)}
                </h2>
                <Aurebesh text={species.id} className="hidden sm:inline-block text-[10px] text-holo-cyan/60" />
              </div>
              <div className="text-[11px] text-slate-400">
                {L(species.classification, lang)} ·{' '}
                <span className="text-holo-cyan">{L(species.homeworldName, lang)}</span>
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
          {/* Hero Row: Portrait + Key Biological Telemetry */}
          <div className="grid gap-6 sm:grid-cols-12 items-start">
            {/* Portrait */}
            <div className="sm:col-span-5 relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/15 bg-black/80 shadow-inner">
              <img
                src={`/species/${species.id}.webp`}
                alt={L(species.names, lang)}
                width={400}
                height={500}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className={`rounded border px-2 py-0.5 font-hud text-[9px] uppercase tracking-wider backdrop-blur-xs ${forceSensitivityBadge.color}`}>
                  {forceSensitivityBadge.label}
                </span>
                <span className="font-hud text-[10px] text-slate-400">
                  {species.averageHeight}
                </span>
              </div>
            </div>

            {/* Quick Biological Stats */}
            <div className="sm:col-span-7 space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 text-xs">
                <div>
                  <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                    {lang === 'tr' ? 'Köken & Anavatan Gezegeni' : 'Origin & Homeworld'}
                  </span>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-medium text-slate-200">
                      {L(species.homeworldName, lang)}
                    </span>
                    {species.homeworldPlanetId && (
                      <Link
                        to={`/planet/${species.homeworldPlanetId}`}
                        onClick={onClose}
                        className="rounded border border-holo-cyan/40 bg-holo-cyan/15 px-2 py-0.5 font-hud text-[10px] text-holo-cyan hover:bg-holo-cyan/25 transition-colors"
                      >
                        🪐 {lang === 'tr' ? 'Gezegeni Görüntüle' : 'View Planet'}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-white/8 pt-3">
                  <div>
                    <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                      {lang === 'tr' ? 'Ana Dil' : 'Native Language'}
                    </span>
                    <span className="mt-0.5 block font-medium text-slate-300">
                      {L(species.language, lang)}
                    </span>
                  </div>
                  <div>
                    <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                      {lang === 'tr' ? 'Ortalama Yaşam' : 'Average Lifespan'}
                    </span>
                    <span className="mt-0.5 block font-medium text-slate-300">
                      {species.averageLifespan}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/8 pt-3">
                  <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                    {lang === 'tr' ? 'Fiziksel / Deri Tonları' : 'Skin & Physical Pigment'}
                  </span>
                  <span className="mt-0.5 block text-slate-300 leading-relaxed">
                    {L(species.skinHairColors, lang)}
                  </span>
                </div>

                <div className="border-t border-white/8 pt-3">
                  <span className="font-hud text-[10px] uppercase tracking-wider text-holo-cyan block">
                    {lang === 'tr' ? 'Ayırt Edici Anatomik Nitelikler' : 'Distinctive Anatomical Traits'}
                  </span>
                  <span className="mt-0.5 block text-slate-200 leading-relaxed font-medium">
                    {L(species.distinctions, lang)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lore & Evolutionary Archive */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="mb-1.5 font-hud text-[10px] uppercase tracking-wider text-slate-500">
              {lang === 'tr' ? 'Ksenobiyoloji & Evrimsel Tarihçe' : 'Xenobiology & Evolutionary Lore'}
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {L(species.desc, lang)}
            </p>
          </div>

          {/* Notable Members & Appearances */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-star-gold/20 bg-black/30 p-4">
              <div className="mb-2 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-star-gold">
                <span>👤</span>
                <span>{lang === 'tr' ? 'Tanınmış Temsilciler' : 'Notable Members'}</span>
              </div>
              <div className="text-xs font-medium text-slate-200 leading-relaxed">
                {L(species.notableMembers, lang)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="mb-2 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-slate-400">
                <span>🎬</span>
                <span>{lang === 'tr' ? 'Göründüğü Yapımlar' : 'Appearances'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {species.appearances.map((app) => (
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

          {/* Canonical Source Link */}
          <div className="border-t border-white/10 pt-3">
            <SourceLink source={species.source} />
          </div>
        </div>
      </div>
    </div>
  )
}
