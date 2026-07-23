import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import type { CelestialBody } from '../types/lore'
import { SystemEngine } from '../lib/engine/system-engine'
import { simClock } from '../lib/sim-clock'
import { loadBody } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import TopBar from '../components/hud/TopBar'
import TimeBar from '../components/hud/TimeBar'
import { useJump } from '../components/useJump'

interface Label {
  id: string
  name: string
  x: number
  y: number
  visible: boolean
  minor?: boolean
}

export default function SystemView() {
  const { id = 'tatooine' } = useParams()
  const lang = useApp((s) => s.lang)
  const era = useApp((s) => s.era)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [body, setBody] = useState<CelestialBody | null>(null)
  const [labels, setLabels] = useState<Label[]>([])
  const jump = useJump()
  const jumpRef = useRef(jump)
  jumpRef.current = jump

  useEffect(() => {
    let cancelled = false
    setBody(null)
    loadBody(id).then((b) => {
      if (!cancelled) setBody(b)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!body || !canvasRef.current) return
    const engine = new SystemEngine(canvasRef.current, {
      getSimTime: () => simClock.getTime(),
      onSelectBody: (bodyId) => jumpRef.current(`/planet/${bodyId}`),
      onLabelPositions: setLabels,
    })
    engine.init(body, era, lang)
    return () => engine.dispose()
  }, [body, era, lang])

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      <canvas ref={canvasRef} className="h-full w-full" />
      <TopBar />
      <TimeBar />

      {body && (
        <div className="pointer-events-none absolute left-4 top-24 z-10 rounded-lg border border-holo-cyan/15 bg-panel/80 p-4 backdrop-blur-md">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
            {t('system', lang)}
          </div>
          <div className="font-display text-xl tracking-[0.2em] text-slate-100">
            {body.system.toUpperCase()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {body.suns?.map((s) => s.name).join(' · ')}
          </div>
          <div className="mt-2 text-[11px] text-holo-cyan/70">{t('clickPlanetHint', lang)}</div>
        </div>
      )}

      {labels.map(
        (label) =>
          label.visible && (
            <button
              key={label.id}
              style={{ left: label.x, top: label.y }}
              onClick={() => jump(`/planet/${label.id}`)}
              className={`absolute z-10 -translate-x-1/2 rounded border backdrop-blur-sm transition-colors hover:border-holo-cyan/50 hover:text-holo-cyan ${
                label.minor
                  ? 'border-white/5 bg-black/40 px-1 py-px text-[8.5px] tracking-[0.16em] text-slate-400'
                  : 'border-white/10 bg-black/50 px-1.5 py-0.5 text-[10px] tracking-[0.2em] text-slate-200'
              }`}
            >
              {label.name.toUpperCase()}
            </button>
          ),
      )}

      {body && (
        <button
          onClick={() => jump(`/planet/${body.id}`)}
          className="pointer-events-auto absolute bottom-4 right-4 z-20 rounded border border-white/10 bg-panel/80 px-3 py-1.5 text-[12px] tracking-wide text-slate-200 backdrop-blur-md transition-colors hover:border-holo-cyan/50 hover:text-holo-cyan"
        >
          ◈ {t('enterPlanet', lang)}
        </button>
      )}

      {!body && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-space">
          <div className="animate-pulse text-[13px] tracking-[0.3em] text-holo-cyan">
            {t('loading', lang)}
          </div>
        </div>
      )}
    </div>
  )
}
