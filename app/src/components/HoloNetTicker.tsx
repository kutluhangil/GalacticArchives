// HoloNet news band on the galaxy map: headlines for the selected era, built
// from the archive's own sourced timeline and battle records — no new lore.
// Rotates on its own, but holds still on hover, focus, pause or reduced motion.

import { useEffect, useMemo, useState } from 'react'
import { L, loadBattles, loadTimelineEvents } from '../lib/lore'
import type { EraId } from '../types/lore'
import type { Lang } from '../state/app'

interface Headline {
  id: string
  year: string
  text: string
  planetId?: string
}

const ROTATE_MS = 7000

export default function HoloNetTicker({ era, lang, onGo }: { era: EraId; lang: Lang; onGo: (planetId: string) => void }) {
  const [items, setItems] = useState<Headline[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  useEffect(() => {
    let live = true
    void Promise.all([loadTimelineEvents(), loadBattles()]).then(([events, battles]) => {
      if (!live) return
      const seen = new Set<string>()
      const out: Headline[] = []
      // timeline entries and battles share ids for the same event; keep one
      for (const e of events.filter((e) => e.era === era)) {
        seen.add(e.id)
        out.push({ id: e.id, year: e.yearLabel, text: L(e.titles, lang), planetId: e.planetId })
      }
      for (const b of battles.filter((b) => b.era === era && !seen.has(b.id))) {
        out.push({ id: b.id, year: b.yearLabel, text: L(b.names, lang), planetId: b.locationPlanetId })
      }
      setItems(out)
      setIndex(0)
    })
    return () => {
      live = false
    }
  }, [era, lang])

  const still = paused || held || reducedMotion
  useEffect(() => {
    if (still || items.length < 2) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [still, items.length])

  if (!items.length) return null
  const item = items[index % items.length]
  const tr = lang === 'tr'

  return (
    <div
      role="region"
      aria-label="HoloNet"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2 rounded border border-holo-cyan/25 bg-panel/80 px-2 py-1 font-hud text-[11px] backdrop-blur-md max-md:bottom-14"
    >
      <span className="shrink-0 animate-pulse text-[9px] font-bold tracking-[0.3em] text-sith-red">● HOLONET</span>
      <button
        onClick={() => item.planetId && onGo(item.planetId)}
        disabled={!item.planetId}
        className="min-w-0 flex-1 truncate text-left text-slate-200 hover:text-holo-cyan disabled:hover:text-slate-200"
        title={item.text}
      >
        <span className="mr-1.5 text-star-gold">{item.year}</span>
        {item.text}
      </button>
      <span className="shrink-0 text-[9px] text-slate-500" aria-hidden>
        {(index % items.length) + 1}/{items.length}
      </span>
      <button
        onClick={() => setIndex((i) => (i + 1) % items.length)}
        aria-label={tr ? 'Sonraki manşet' : 'Next headline'}
        className="shrink-0 rounded px-1 text-slate-400 hover:text-holo-cyan"
      >
        ›
      </button>
      {!reducedMotion && (
        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? (tr ? 'Bandı oynat' : 'Play headlines') : tr ? 'Bandı durdur' : 'Pause headlines'}
          className="shrink-0 rounded px-1 text-slate-400 hover:text-holo-cyan"
        >
          {paused ? '▶' : '❚❚'}
        </button>
      )}
    </div>
  )
}
