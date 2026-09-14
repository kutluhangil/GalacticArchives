import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import type { CelestialBody, Poi } from '../types/lore'
import { PlanetEngine, type PoiScreenPos } from '../lib/engine/planet-engine'
import { simClock } from '../lib/sim-clock'
import { loadAllPlanets, loadBody, L } from '../lib/lore'
import { pushRecent } from '../lib/collections'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import TopBar from '../components/hud/TopBar'
import PlanetPanel from '../components/hud/PlanetPanel'
import TimeBar from '../components/hud/TimeBar'
import { useFlyTo } from '../components/useFlyTo'
import EraDissolve from '../components/EraDissolve'
import { useEraDissolve } from '../components/useEraDissolve'
import { KesselRun, Porg } from '../components/EasterEggs'
import RecordLoadOverlay from '../components/RecordLoadOverlay'
import WebGLUnavailable from '../components/WebGLUnavailable'
import { detectRenderCompatibility, type RenderCompatibility } from '../lib/render-compatibility'

export default function PlanetView() {
  const { id = 'tatooine' } = useParams()
  const lang = useApp((s) => s.lang)
  const era = useApp((s) => s.era)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<PlanetEngine | null>(null)
  const pending = useRef<number | null>(null)
  const [loaded, setLoaded] = useState<{ id: string; body: CelestialBody; systemHost: string } | null>(null)
  const [poiPos, setPoiPos] = useState<PoiScreenPos[]>([])
  const [activePoi, setActivePoi] = useState<Poi | null>(null)
  const [fps, setFps] = useState(0)
  const [loadError, setLoadError] = useState<{ id: string; error: unknown } | null>(null)
  const [textureError, setTextureError] = useState<{ id: string; error: Error } | null>(null)
  const [renderCompatibility, setRenderCompatibility] = useState<RenderCompatibility>(detectRenderCompatibility)
  const jump = useFlyTo()
  const dissolve = useEraDissolve()
  // keyed by id, so a route change reads as "not loaded yet" without a reset
  const body = loaded?.id === id ? loaded.body : null
  const systemHost = loaded?.id === id ? loaded.systemHost : id
  useDocumentTitle(body ? L(body.names, lang) : null)

  useEffect(() => {
    let cancelled = false
    loadBody(id).then(async (b) => {
      if (cancelled) return
      pushRecent(b.id)
      // moons & stations belong to a parent system route
      let host = id
      if (b.kind === 'moon' || b.kind === 'station') {
        if (b.orbitHost) {
          host = b.orbitHost
        } else {
          const all = await loadAllPlanets()
          const parent = all.find((p) => (p.moonsDetail ?? []).some((m) => m.id === b.id))
          if (parent) host = parent.id
        }
      }
      if (!cancelled) setLoaded({ id, body: b, systemHost: host })
    }).catch((error: unknown) => {
      if (!cancelled) setLoadError({ id, error })
    })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!body || !canvasRef.current || !renderCompatibility.supported) return
    const canvas = canvasRef.current
    let engine: PlanetEngine | null = null
    // Building the scene blocks the main thread for a couple of seconds on a
    // cold route (shader compile, geometry, texture upload). Two frames put
    // that work after the panel's first paint, so the record is readable and
    // the HUD responds while the globe assembles.
    const frame = requestAnimationFrame(() => {
      const build = requestAnimationFrame(() => {
        try {
          engine = new PlanetEngine(canvas, {
            getSimTime: () => simClock.getTime(),
            onFps: setFps,
            onPoiPositions: setPoiPos,
            onAssetError: (error) => setTextureError({ id, error }),
          })
          engine.init(body, era)
          engineRef.current = engine
          dissolve.onBuild(body.id)
        } catch {
          setRenderCompatibility({ supported: false, reason: 'context-creation-failed' })
        }
      })
      pending.current = build
    })
    return () => {
      cancelAnimationFrame(frame)
      if (pending.current !== null) cancelAnimationFrame(pending.current)
      pending.current = null
      if (!engine) return
      dissolve.onTeardown(engine)
      engineRef.current = null
      engine.dispose()
    }
    // dissolve helpers are stable refs; excluding them keeps the rebuild keyed
    // strictly to body/era
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, era, renderCompatibility])

  // leaving a world is the dive in reverse: pull back, then swap views
  const departTo = (path: string) => jump(path, () => engineRef.current?.depart() ?? 0)

  const pois = body?.poi ?? []

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      <canvas ref={canvasRef} className="h-full w-full" />
      {dissolve.snap && (
        <EraDissolve key={dissolve.snap} src={dissolve.snap} onDone={dissolve.clear} />
      )}
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
              <span className="absolute left-3 top-0 z-20 w-56 rounded border border-holo-cyan/25 bg-panel/95 p-2 text-left backdrop-blur-sm">
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
        onClick={() => departTo(`/system/${systemHost}`)}
        className="pointer-events-auto absolute bottom-4 right-4 z-20 rounded border border-white/10 bg-panel/80 px-3 py-1.5 text-[12px] tracking-wide text-slate-200 backdrop-blur-md transition-colors hover:border-holo-cyan/50 hover:text-holo-cyan"
      >
        ◇ {t('enterSystem', lang)}
      </button>

      {id === 'kessel' && <KesselRun />}
      {id === 'ahch-to' && <Porg />}

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 text-[10px] tracking-wider text-slate-600">
        {t('dragHint', lang)} · {Math.round(fps)} fps
      </div>

      {!body && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-space">
          <RecordLoadOverlay error={loadError?.id === id ? loadError.error : undefined} lang={lang} />
        </div>
      )}

      {textureError?.id === id && body && (
        <div role="alert" className="absolute bottom-12 left-4 z-30 max-w-sm rounded border border-holo-red/40 bg-panel/95 p-3 text-xs text-slate-300 backdrop-blur-sm">
          <span className="font-semibold text-holo-red">{t('textureErrorTitle', lang)}</span>{' '}
          {textureError.error.message}
        </div>
      )}
      {!renderCompatibility.supported && (
        <WebGLUnavailable lang={lang} onRetry={() => setRenderCompatibility(detectRenderCompatibility())} />
      )}
    </div>
  )
}
