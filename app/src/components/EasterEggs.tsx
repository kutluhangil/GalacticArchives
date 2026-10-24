// Two small rewards for visiting the right worlds: a Kessel Run stopwatch
// timing a loop of the Maw, and a porg that chirps when poked on Ahch-To.

import { useEffect, useState } from 'react'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import { useLater } from '../hooks/useLater'

/** how long one loop of the Maw takes */
const RUN_MS = 6400

/** Stopwatch framed in parsecs — the distance boast, not a duration. */
export function KesselRun() {
  const lang = useApp((s) => s.lang)
  const [running, setRunning] = useState(false)
  const [parsecs, setParsecs] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  // the stopwatch lives entirely in an effect: reading the clock while
  // rendering would make the component impure
  useEffect(() => {
    if (!running) return
    const startedAt = performance.now()
    let raf = 0
    const tick = () => {
      setElapsed((performance.now() - startedAt) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // the run itself: a fixed 6.4 s loop of the Maw, then the score lands
    const done = window.setTimeout(() => {
      setRunning(false)
      const seconds = (performance.now() - startedAt) / 1000
      // shave parsecs for a tighter line through the black holes
      setParsecs(Math.max(11.2, 18 - seconds))
    }, RUN_MS)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(done)
    }
  }, [running])

  const start = () => {
    setParsecs(null)
    setElapsed(0)
    setRunning(true)
  }

  return (
    <div className="pointer-events-auto absolute bottom-16 right-4 z-20 w-52 rounded-lg border border-star-gold/25 bg-panel/85 p-3 backdrop-blur-md">
      <div className="mb-1 font-hud text-[10px] uppercase tracking-[0.3em] text-star-gold/80">
        {t('kesselRun', lang)}
      </div>
      <div className="font-display text-2xl tabular-nums tracking-wider text-slate-100">
        {parsecs !== null
          ? `${parsecs.toFixed(1)} ${t('kesselResult', lang)}`
          : `${elapsed.toFixed(2)}s`}
      </div>
      {parsecs !== null && (
        <p className="mt-1 text-[11px] leading-snug text-slate-400">{t('kesselBrag', lang)}</p>
      )}
      <button
        onClick={start}
        disabled={running}
        className="mt-2 w-full rounded border border-star-gold/30 bg-star-gold/10 px-2 py-1 text-[11px] tracking-wide text-star-gold transition-colors hover:bg-star-gold/20 disabled:opacity-40"
      >
        {parsecs !== null ? t('kesselAgain', lang) : t('kesselStart', lang)}
      </button>
    </div>
  )
}

/** A porg perched on the HUD. Poke it. */
export function Porg() {
  const [startled, setStartled] = useState(false)
  const later = useLater()
  return (
    <button
      aria-label="porg"
      onClick={() => {
        setStartled(true)
        later(() => setStartled(false), 420)
      }}
      className={`pointer-events-auto absolute bottom-16 right-6 z-20 transition-transform duration-200 ${
        startled ? '-translate-y-2 scale-110' : ''
      }`}
    >
      <svg viewBox="0 0 40 40" className="h-12 w-12 drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]">
        <ellipse cx="20" cy="27" rx="11" ry="10" fill="#C9B79C" />
        <ellipse cx="20" cy="30" rx="7" ry="6.5" fill="#F0E6D6" />
        <circle cx="20" cy="16" r="9" fill="#D8C7AC" />
        <circle cx="16.5" cy="15" r={startled ? 2.6 : 2} fill="#241C14" />
        <circle cx="23.5" cy="15" r={startled ? 2.6 : 2} fill="#241C14" />
        <circle cx="17.2" cy="14.2" r="0.7" fill="#fff" />
        <circle cx="24.2" cy="14.2" r="0.7" fill="#fff" />
        <path d="M18.4 19.2h3.2l-1.6 2.2z" fill="#E2A857" />
      </svg>
    </button>
  )
}
