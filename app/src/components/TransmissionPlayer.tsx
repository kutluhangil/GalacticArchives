import { useEffect, useState } from 'react'
import { L, loadTransmissions } from '../lib/lore'
import type { Transmission } from '../types/lore'
import { useApp } from '../state/app'
import { sfx } from '../lib/audio'
import ModalShell from './ModalShell'
import SourceLink from './SourceLink'

export default function TransmissionPlayer({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const [transmissions, setTransmissions] = useState<Transmission[]>([])
  const [active, setActive] = useState<Transmission | null>(null)
  const [playing, setPlaying] = useState<boolean>(false)

  useEffect(() => {
    loadTransmissions().then((data) => {
      setTransmissions(data)
      if (data.length > 0) setActive(data[0])
    })
  }, [])

  const togglePlay = () => {
    sfx.playTransmission()
    setPlaying(!playing)
  }

  return (
    <ModalShell
      title={`📻 ${lang === 'tr' ? 'ARŞİV SESLİ TELSİZ KAYITLARI' : 'ARCHIVAL TRANSMISSIONS PLAYER'}`}
      onClose={onClose}
      panelClassName="max-w-2xl"
    >

        <div className="mt-4 grid gap-4 sm:grid-cols-12">
          {/* Transmission List */}
          <div className="sm:col-span-5 space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {transmissions.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  sfx.playHover()
                  setActive(t)
                  setPlaying(true)
                }}
                className={`block w-full rounded border px-3 py-2 text-left transition-all ${
                  active?.id === t.id
                    ? 'border-holo-cyan/60 bg-holo-cyan/15 text-holo-cyan'
                    : 'border-white/10 bg-black/40 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="font-hud text-xs font-bold truncate">{L(t.title, lang)}</div>
                <div className="text-[10px] text-slate-400">{L(t.speaker, lang)} · {t.yearLabel}</div>
              </button>
            ))}
          </div>

          {/* Active Player & Transcript */}
          {active && (
            <div className="sm:col-span-7 flex flex-col justify-between rounded-lg border border-white/10 bg-black/50 p-4">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display text-md tracking-wider text-slate-100">
                      {L(active.title, lang)}
                    </h3>
                    <div className="font-hud text-xs text-star-gold">{L(active.speaker, lang)}</div>
                    <div
                      className="mt-0.5 text-[10px] text-slate-500"
                      title={
                        lang === 'tr'
                          ? 'Kaynak makale bu kayda bir frekans ya da kanal vermiyor; bu satır ortamı arşivin kendi sözleriyle tarif eder.'
                          : 'No cited article gives this recording a frequency or channel; this line is the archive describing the medium in its own words.'
                      }
                    >
                      {active.channelLabel}
                      <span className="text-slate-600">
                        {' · '}
                        {lang === 'tr' ? 'arşiv etiketi' : 'archive label'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={togglePlay}
                    className="rounded border border-holo-cyan/50 bg-holo-cyan/15 px-3 py-1 font-hud text-xs text-holo-cyan hover:bg-holo-cyan/25"
                  >
                    {playing ? '⏸ PAUSE' : '▶ PLAY'}
                  </button>
                </div>

                {/* Animated Waveform Indicator */}
                <div className="my-4 flex items-center justify-center gap-1.5 h-8 bg-black/60 rounded border border-white/5 px-4">
                  {[40, 70, 30, 90, 50, 80, 20, 100, 60, 40, 85, 30].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 bg-holo-cyan/80 rounded transition-all duration-300${
                        playing ? ' ga-waveform-bar' : ''
                      }`}
                      style={{
                        height: playing ? `${h}%` : '20%',
                        animationDelay: `${i * 70}ms`,
                      }}
                    />
                  ))}
                </div>

                <div className="rounded bg-black/40 p-3 border border-white/5 font-mono text-[11px] leading-relaxed text-slate-200">
                  "{L(active.transcript, lang)}"
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`font-hud text-[9px] uppercase tracking-wider ${
                      active.verbatim ? 'text-slate-500' : 'text-star-gold/80'
                    }`}
                    title={
                      active.verbatim
                        ? lang === 'tr'
                          ? 'Sözler kaynak makaleden birebir alıntı'
                          : 'Quoted word for word from the cited article'
                        : lang === 'tr'
                          ? 'Sahneden bu arşiv tarafından yeniden yazıldı; birebir alıntı değil'
                          : 'Reconstructed from the scene by this archive, not a quotation'
                    }
                  >
                    {active.verbatim
                      ? lang === 'tr'
                        ? 'Birebir alıntı'
                        : 'Verbatim'
                      : lang === 'tr'
                        ? 'Arşiv yeniden yazımı'
                        : 'Archive reconstruction'}
                  </span>
                  <SourceLink source={active.source} />
                </div>
              </div>
            </div>
          )}
        </div>
    </ModalShell>
  )
}
