// Bestiary Creature Dossier Modal — Galactic Wildlife & Apex Predators
// Biological classifications, behavioral ecology, danger ratings, and canonical encounters.

import { useEffect } from 'react'
import type { BestiaryCreature } from '../types/lore'
import { L, LL } from '../lib/lore'
import Aurebesh from './Aurebesh'
import SourceLink from './SourceLink'

interface Props {
  creature: BestiaryCreature | null
  onClose: () => void
  lang: 'en' | 'tr'
}

export default function BestiaryModal({ creature, onClose, lang }: Props) {
  useEffect(() => {
    if (!creature) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [creature, onClose])

  if (!creature) return null

  const dangerConfig = {
    'low': {
      label: lang === 'tr' ? 'DÜŞÜK TEHLİKE' : 'LOW THREAT',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    'moderate': {
      label: lang === 'tr' ? 'ORTA TEHLİKE' : 'MODERATE THREAT',
      color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    },
    'high': {
      label: lang === 'tr' ? 'YÜKSEK TEHLİKE' : 'HIGH THREAT',
      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    },
    'extreme': {
      label: lang === 'tr' ? 'AŞIRI TEHLİKE' : 'EXTREME THREAT',
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    },
    'lethal': {
      label: lang === 'tr' ? 'ÖLÜMCÜL TEHLİKE' : 'LETHAL APEX PREDATOR',
      color: 'text-red-400 border-red-500/40 bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
    },
  }[creature.dangerLevel]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bestiary-modal-title"
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
              🐾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="bestiary-modal-title"
                  className="font-display text-lg sm:text-xl tracking-wide text-slate-100"
                >
                  {L(creature.names, lang)}
                </h2>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider ${dangerConfig.color}`}
                >
                  {dangerConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{L(creature.classification, lang)}</span>
                <span className="text-slate-600">·</span>
                <Aurebesh text={creature.names.en} className="text-holo-cyan/60 text-[10px]" />
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-holo-cyan/40 hover:bg-holo-cyan/10 hover:text-holo-cyan transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Visual Asset (16:9 Archival Photo) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-holo-cyan/30 bg-space-dark/80 shadow-inner">
            <img
              src={`/bestiary/${creature.id}.webp`}
              alt={L(creature.names, lang)}
              className="h-full w-full object-contain"
              loading="lazy"
            />
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/70 px-2.5 py-1 text-[10px] font-mono text-holo-cyan/80 border border-holo-cyan/20 backdrop-blur-xs">
              BIO-SCAN ARCHIVE // ID: {creature.id.toUpperCase()}
            </div>
          </div>

          {/* Quick Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'Anavatan Gezegen' : 'Homeworld'}
              </span>
              <span className="mt-1 block font-display text-xs sm:text-sm text-slate-100">
                {L(creature.homeworld, lang)}
              </span>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'Beslenme Tarzı' : 'Dietary Habit'}
              </span>
              <span className="mt-1 block font-mono text-xs sm:text-sm text-holo-cyan">
                {L(creature.diet, lang)}
              </span>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'Ortalama Boyut' : 'Average Size'}
              </span>
              <span className="mt-1 block font-mono text-xs sm:text-sm text-slate-200">
                {creature.averageSize}
              </span>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'Tehlike Sınıfı' : 'Threat Level'}
              </span>
              <span className="mt-1 block font-mono text-xs sm:text-sm font-semibold capitalize text-red-400">
                {creature.dangerLevel}
              </span>
            </div>
          </div>

          {/* Biological Adaptations & Behavioral Traits */}
          <div className="space-y-2">
            <h3 className="font-hud text-xs tracking-wider uppercase text-holo-cyan">
              {lang === 'tr' ? 'Biyolojik Uyarlamalar ve Özellikler' : 'Biological Traits & Adaptations'}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {LL(creature.traits, lang).map((trait, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300"
                >
                  <span className="text-holo-cyan mt-0.5">◈</span>
                  <span>{trait}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Temperament & Behavior */}
          <div className="space-y-1.5 rounded-lg border border-holo-cyan/20 bg-holo-cyan/[0.03] p-4">
            <h3 className="font-hud text-xs tracking-wider uppercase text-holo-cyan">
              {lang === 'tr' ? 'Mizaç ve Davranış Kalıpları' : 'Temperament & Behavior'}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              {L(creature.temperament, lang)}
            </p>
          </div>

          {/* Notable Encounters & History */}
          <div className="space-y-1.5 rounded-lg border border-white/10 bg-black/40 p-4">
            <h3 className="font-hud text-xs tracking-wider uppercase text-star-gold">
              {lang === 'tr' ? 'Önemli Karşılaşmalar ve Kanonik Kayıtlar' : 'Notable Canonical Encounters'}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              {L(creature.notableEncounters, lang)}
            </p>
          </div>

          {/* Detailed Natural History / Description */}
          <div className="space-y-2">
            <h3 className="font-hud text-xs tracking-wider uppercase text-slate-400">
              {lang === 'tr' ? 'Doğal Yaşam ve Ekoloji Arşivi' : 'Ecological & Archival Overview'}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              {L(creature.desc, lang)}
            </p>
          </div>

          {/* Canonical Media Appearances */}
          {creature.appearances.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-hud text-xs tracking-wider uppercase text-slate-400">
                {lang === 'tr' ? 'Göründüğü Yapımlar' : 'Canonical Appearances'}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {creature.appearances.map((app) => (
                  <span
                    key={app}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Archival Citation */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>{lang === 'tr' ? 'Holocron Biyolojik Veritabanı' : 'Holocron Fauna Database'}</span>
            <SourceLink source={creature.source} />
          </div>
        </div>
      </div>
    </div>
  )
}
