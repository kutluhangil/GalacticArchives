// Guided tours: a narrated route through the galaxy. The player owns the
// navigation — each stop swaps the planet route and the arriving view plays
// its own dive-in, so a tour looks like a flight plan rather than a slideshow.

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { L } from '../lib/lore'
import { loadLaneTour, type PlayableTour } from '../lib/lane-tour'
import { authoredTour } from '../lib/tours'
import { t, tf } from '../lib/ui-strings'
import { useApp } from '../state/app'

/** how long a stop holds before the tour moves on */
const STOP_MS = 12000

export default function TourPlayer() {
  const lang = useApp((s) => s.lang)
  const tour = useApp((s) => s.tour)
  const setTourStep = useApp((s) => s.setTourStep)
  const toggleTourPlaying = useApp((s) => s.toggleTourPlaying)
  const endTour = useApp((s) => s.endTour)
  const navigate = useNavigate()
  const location = useLocation()

  // A lane tour has to load the worlds it narrates, so it resolves in an
  // effect. What is stored is the lane it belongs to as well as the tour, so
  // switching lanes reads as "not loaded yet" without a second setState to
  // clear it — the stale tour is never the one rendered.
  const [resolved, setResolved] = useState<{ laneId: string; tour: PlayableTour } | null>(null)
  const source = tour?.source
  const laneId = source?.kind === 'lane' ? source.id : null
  useEffect(() => {
    if (!laneId) return
    let live = true
    void loadLaneTour(laneId).then((tour) => {
      if (live) setResolved({ laneId, tour })
    })
    return () => {
      live = false
    }
  }, [laneId])

  const definition =
    source?.kind === 'authored'
      ? authoredTour(source.id)
      : resolved?.laneId === laneId
        ? resolved.tour
        : undefined
  const stop = definition?.stops[tour?.step ?? 0]
  const target = stop ? `/planet/${stop.bodyId}` : null

  // drive the route from the tour position, not the other way round
  useEffect(() => {
    if (target && location.pathname !== target) navigate(target)
  }, [target, location.pathname, navigate])

  useEffect(() => {
    if (!tour || !definition || !tour.playing) return
    const last = tour.step >= definition.stops.length - 1
    const id = window.setTimeout(() => {
      if (last) endTour()
      else setTourStep(tour.step + 1)
    }, STOP_MS)
    return () => window.clearTimeout(id)
  }, [tour, definition, setTourStep, endTour])

  if (!tour || !definition || !stop) return null

  const total = definition.stops.length
  const atStart = tour.step === 0
  const atEnd = tour.step === total - 1

  return (
    <section
      aria-label={L(definition.names, lang)}
      className="pointer-events-auto fixed bottom-16 left-1/2 z-40 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-star-gold/25 bg-panel/90 p-4 backdrop-blur-md"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-hud text-[10px] uppercase tracking-[0.3em] text-star-gold/80">
          {L(definition.names, lang)}
        </span>
        <span className="text-[10px] tracking-[0.2em] text-slate-500">
          {tour.step + 1} / {total}
        </span>
      </div>

      <p className="mb-3 text-[13px] leading-relaxed text-slate-200">{L(stop.narration, lang)}</p>

      {definition.skipped > 0 && (
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          {tf('laneSkipped', lang, { n: definition.skipped })}
        </p>
      )}

      <div className="mb-3 flex gap-1" aria-hidden>
        {definition.stops.map((s, i) => (
          <span
            key={s.bodyId + i}
            className={`h-0.5 flex-1 rounded ${i <= tour.step ? 'bg-star-gold/70' : 'bg-white/10'}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTourStep(tour.step - 1)}
          disabled={atStart}
          className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition-colors hover:border-holo-cyan/50 hover:text-holo-cyan disabled:opacity-30"
        >
          ← {t('tourPrev', lang)}
        </button>
        <button
          onClick={toggleTourPlaying}
          className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition-colors hover:border-holo-cyan/50 hover:text-holo-cyan"
        >
          {tour.playing ? `⏸ ${t('tourPause', lang)}` : `▶ ${t('tourResume', lang)}`}
        </button>
        <button
          onClick={() => (atEnd ? endTour() : setTourStep(tour.step + 1))}
          className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition-colors hover:border-holo-cyan/50 hover:text-holo-cyan"
        >
          {atEnd ? t('tourFinish', lang) : `${t('tourNext', lang)} →`}
        </button>
        <button
          onClick={endTour}
          className="ml-auto rounded border border-white/10 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-sith-red/50 hover:text-red-300"
        >
          ✕ {t('tourExit', lang)}
        </button>
      </div>
    </section>
  )
}
