// Droid Dossier Modal — Droid Directory & Technical Specifications
// Features Class I-V classification, manufacturer, armament, and interactive audio Vocabulator.

import { useEffect, useState } from 'react'
import type { Droid } from '../types/lore'
import { L } from '../lib/lore'
import Aurebesh from './Aurebesh'
import SourceLink from './SourceLink'
import { playDroidVocabulator } from '../lib/droid-audio'

interface Props {
  droid: Droid | null
  onClose: () => void
  lang: 'en' | 'tr'
}

export default function DroidModal({ droid, onClose, lang }: Props) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  useEffect(() => {
    if (!droid) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [droid, onClose])

  if (!droid) return null

  const handlePlayAudio = () => {
    setIsPlayingAudio(true)
    playDroidVocabulator(droid.soundType)
    setTimeout(() => setIsPlayingAudio(false), 500)
  }

  const classColorMap = {
    'class-1': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    'class-2': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    'class-3': 'text-star-gold border-star-gold/30 bg-star-gold/10',
    'class-4': 'text-red-400 border-red-500/30 bg-red-500/10',
    'class-5': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  }[droid.droidClass]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="droid-modal-title"
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
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="droid-modal-title"
                  className="font-display text-lg sm:text-xl tracking-wide text-slate-100"
                >
                  {L(droid.names, lang)}
                </h2>
                <Aurebesh text={droid.model} className="hidden sm:inline-block text-[10px] text-holo-cyan/60" />
              </div>
              <div className="text-[11px] text-slate-400">
                {droid.model} · <span className="text-holo-cyan">{L(droid.droidClassName, lang)}</span>
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
          {/* Hero Row: Portrait + Technical Specifications */}
          <div className="grid gap-6 sm:grid-cols-12 items-start">
            {/* Portrait */}
            <div className="sm:col-span-5 relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/15 bg-black/80 shadow-inner">
              <img
                src={`/droids/${droid.id}.webp`}
                alt={L(droid.names, lang)}
                width={400}
                height={500}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className={`rounded border px-2 py-0.5 font-hud text-[9px] uppercase tracking-wider backdrop-blur-xs ${classColorMap}`}>
                  {L(droid.droidClassName, lang).split(' ')[0]}
                </span>
                <span className="font-hud text-[10px] text-slate-400">
                  {droid.height}
                </span>
              </div>
            </div>

            {/* Technical Specs & Vocabulator */}
            <div className="sm:col-span-7 space-y-3">
              {/* Vocabulator Audio Synthesizer Button */}
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 font-hud text-xs uppercase tracking-widest transition-all ${
                  isPlayingAudio
                    ? 'border-holo-cyan bg-holo-cyan/30 text-white shadow-[0_0_20px_rgba(0,240,255,0.6)] scale-[0.98]'
                    : 'border-holo-cyan/50 bg-holo-cyan/15 text-holo-cyan hover:bg-holo-cyan/25 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                }`}
              >
                <span className="text-base">{isPlayingAudio ? '⚡' : '🔊'}</span>
                <span>
                  {isPlayingAudio
                    ? (lang === 'tr' ? 'Vokabülatör Aktif...' : 'Vocabulator Transmitting...')
                    : (lang === 'tr' ? 'Vokabülatör Sesi Dinle' : 'Play Vocabulator Audio')}
                </span>
              </button>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 text-xs">
                <div>
                  <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                    {lang === 'tr' ? 'Temel İşlev & Görev' : 'Primary Function'}
                  </span>
                  <span className="mt-0.5 block font-medium text-slate-200">
                    {L(droid.primaryFunction, lang)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-white/8 pt-3">
                  <div>
                    <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                      {lang === 'tr' ? 'Üretici Firma' : 'Manufacturer'}
                    </span>
                    <span className="mt-0.5 block font-medium text-slate-300">
                      {L(droid.manufacturer, lang)}
                    </span>
                  </div>
                  <div>
                    <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                      {lang === 'tr' ? 'Yükseklik' : 'Height'}
                    </span>
                    <span className="mt-0.5 block font-medium text-slate-300">
                      {droid.height}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/8 pt-3">
                  <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500 block">
                    {lang === 'tr' ? 'Zırh Kaplaması & Sensörler' : 'Plating & Sensors'}
                  </span>
                  <span className="mt-0.5 block text-slate-300 leading-relaxed">
                    {L(droid.platingSensorColor, lang)}
                  </span>
                </div>

                <div className="border-t border-white/8 pt-3">
                  <span className="font-hud text-[10px] uppercase tracking-wider text-holo-cyan block">
                    {lang === 'tr' ? 'Donanım & Silah Sistemleri' : 'Equipment & Armament'}
                  </span>
                  <span className="mt-0.5 block text-slate-200 leading-relaxed font-medium">
                    {L(droid.armamentEquip, lang)}
                  </span>
                </div>

                <div className="border-t border-white/8 pt-3">
                  <span className="font-hud text-[10px] uppercase tracking-wider text-star-gold block">
                    {lang === 'tr' ? 'Tarihsel Bağlılıklar' : 'Affiliations'}
                  </span>
                  <span className="mt-0.5 block text-star-gold/90 font-medium">
                    {L(droid.affiliations, lang)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Droid Archive Lore */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="mb-1.5 font-hud text-[10px] uppercase tracking-wider text-slate-500">
              {lang === 'tr' ? 'Arşiv Özeti & Tarihsel Kayıt' : 'Archive Summary & Historical Record'}
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {L(droid.desc, lang)}
            </p>
          </div>

          {/* Appearances */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 flex items-center gap-2 font-hud text-xs uppercase tracking-wider text-slate-400">
              <span>🎬</span>
              <span>{lang === 'tr' ? 'Göründüğü Yapımlar' : 'Appearances'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {droid.appearances.map((app) => (
                <span
                  key={app}
                  className="rounded border border-white/10 bg-black/50 px-2 py-0.5 font-hud text-[10px] text-slate-300"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>

          {/* Canonical Source Citation */}
          <div className="border-t border-white/10 pt-3">
            <SourceLink source={droid.source} />
          </div>
        </div>
      </div>
    </div>
  )
}
