import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import type { CelestialBody, Poi } from '../types/lore'
import { PlanetEngine, type PoiScreenPos } from '../lib/engine/planet-engine'
import { simClock } from '../lib/sim-clock'
import { loadBody, L } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import TopBar from '../components/hud/TopBar'
import PlanetPanel from '../components/hud/PlanetPanel'
import TimeBar from '../components/hud/TimeBar'
import { useJump } from '../components/useJump'

export default function PlanetView() {
  const { id = 'tatooine' } = useParams()
  const lang = useApp((s) => s.lang)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [body, setBody] = useState<CelestialBody | null>(null)
  const [poiPos, setPoiPos] = useState<PoiScreenPos[]>([])
  const [activePoi, setActivePoi] = useState<Poi | null>(null)
  const [fps, setFps] = useState(0)
  const jump = useJump()

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
    const engine = new PlanetEngine(canvasRef.current, {
      getSimTime: () => simClock.getTime(),
      onFps: setFps,
      onPoiPositions: setPoiPos,
    })
    engine.init(body)
    return () => engine.dispose()
  }, [body])

  const pois = body?.poi ?? []

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      <canvas ref={canvasRef} className="h-full w-full" />
      <TopBar />
      {body && <PlanetPanel body={body} />}
      <TimeBar />

      {/* POI pins projected onto the globe */}
      {pois.map((poi) => {
        const pos = poiPos.find((p) => p.id === poi.id)
        if (!pos?.visible) return null
        return (
          <button
            key={poi.id}
            style={{ left: pos.x, top: pos.y }}
            onMouseEnter={() => setActivePoi(poi)}
            onMouseLeave={() => setActivePoi(null)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="block h-2.5 w-2.5 rounded-full border border-holo-cyan bg-holo-cyan/25 shadow-[0_0_8px_rgba(102,217,255,0.8)] transition-transform hover:scale-150" />
            {activePoi?.id === poi.id && (
              <span className="absolute left-3 top-0 z-20 w-56 rounded border border-holo-cyan/25 bg-panel/95 p-2 text-left backdrop-blur">
                <span className="block text-[11px] font-semibold tracking-wider text-holo-cyan">
                  {L(poi.names, lang)}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate-300">
                  {L(poi.blurb, lang)}
                </span>
              </span>
            )}
          </button>
        )
      })}

      <button
        onClick={() => jump(`/system/${id}`)}
        className="pointer-events-auto absolute bottom-4 right-4 z-20 rounded border border-white/10 bg-panel/80 px-3 py-1.5 text-[12px] tracking-wide text-slate-200 backdrop-blur-md transition-colors hover:border-holo-cyan/50 hover:text-holo-cyan"
      >
        ◇ {t('enterSystem', lang)}
      </button>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 text-[10px] tracking-wider text-slate-600">
        {t('dragHint', lang)} · {Math.round(fps)} fps
      </div>

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
