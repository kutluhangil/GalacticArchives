import { useEffect, useMemo, useRef, useState } from 'react'
import type { CelestialBody, RegionId } from '../types/lore'
import {
  GalaxyEngine,
  gridToPos,
  MANUAL_POS,
  type GalaxyNode,
} from '../lib/engine/galaxy-engine'
import { simClock } from '../lib/sim-clock'
import { factionById, L, loadAllPlanets, regions, rendersAsRubble } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import TopBar from '../components/hud/TopBar'
import { useFlyTo } from '../components/useFlyTo'

interface NodeLabel {
  id: string
  name: string
  x: number
  y: number
  visible: boolean
  destroyed: boolean
}

const NEUTRAL = '#8B94A7'

function nodeStates(planets: CelestialBody[], era: ReturnType<typeof useApp.getState>['era']) {
  return planets.map((p) => ({
    id: p.id,
    color: factionById(p.affiliationsByEra?.[era])?.color ?? NEUTRAL,
    destroyed: rendersAsRubble(p, era),
  }))
}

export default function GalaxyView() {
  const lang = useApp((s) => s.lang)
  const era = useApp((s) => s.era)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GalaxyEngine | null>(null)
  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const [labels, setLabels] = useState<NodeLabel[]>([])
  const [hoverRegion, setHoverRegion] = useState<RegionId | null>(null)
  const [fps, setFps] = useState(0)
  const flyTo = useFlyTo()
  // the engine outlives each render, so route it through a ref instead of
  // rebuilding the scene whenever the callback identity changes
  const diveRef = useRef<(id: string) => void>(() => {})
  diveRef.current = (id: string) =>
    flyTo(`/planet/${id}`, () => engineRef.current?.flyToNode(id) ?? 0)

  useEffect(() => {
    loadAllPlanets().then(setPlanets)
  }, [])

  const nodes = useMemo<GalaxyNode[]>(() => {
    if (!planets.length) return []
    const states = nodeStates(planets, useApp.getState().era)
    return planets.map((p, i) => {
      const pos = p.coordinates ? gridToPos(p.coordinates) : MANUAL_POS[p.id] ?? { x: 0, z: 0 }
      return {
        id: p.id,
        name: p.names[lang],
        x: pos.x,
        z: pos.z,
        color: states[i].color,
        destroyed: states[i].destroyed,
        body: p,
      }
    })
    // era deliberately absent: era switches patch node states without a rebuild
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planets, lang])

  useEffect(() => {
    if (!nodes.length || !canvasRef.current) return
    const engine = new GalaxyEngine(canvasRef.current, {
      getSimTime: () => simClock.getTime(),
      onFps: setFps,
      onSelect: (id) => diveRef.current(id),
      onLabelPositions: setLabels,
      onRegionHover: setHoverRegion,
    })
    engine.init(nodes, useApp.getState().era)
    engineRef.current = engine
    return () => {
      engineRef.current = null
      engine.dispose()
    }
  }, [nodes])

  // era switch: recolor nodes in place (no scene rebuild)
  useEffect(() => {
    if (!planets.length || !engineRef.current) return
    engineRef.current.applyNodeStates(nodeStates(planets, era), era)
  }, [era, planets])

  const regionName = hoverRegion
    ? L(regions.find((r) => r.id === hoverRegion)?.names, lang)
    : null

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      <canvas ref={canvasRef} className="h-full w-full" />
      <TopBar />

      {regionName && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded border border-holo-cyan/20 bg-panel/80 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-holo-cyan backdrop-blur-sm">
          {regionName}
        </div>
      )}

      {labels.map(
        (label) =>
          label.visible && (
            <button
              key={label.id}
              style={{ left: label.x, top: label.y }}
              onClick={() => diveRef.current(label.id)}
              className={`absolute z-10 -translate-x-1/2 rounded px-1 py-0.5 text-[9.5px] tracking-[0.18em] backdrop-blur-[2px] transition-colors ${
                label.destroyed
                  ? 'text-red-400/80 hover:text-red-300'
                  : 'text-slate-300/85 hover:text-holo-cyan'
              }`}
            >
              {label.name.toUpperCase()}
              {label.destroyed && ' ⌀'}
            </button>
          ),
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 text-[10px] tracking-wider text-slate-600">
        {t('clickSystemHint', lang)} · {Math.round(fps)} fps
      </div>

      {!planets.length && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-space">
          <div className="animate-pulse text-[13px] tracking-[0.3em] text-holo-cyan">
            {t('loading', lang)}
          </div>
        </div>
      )}
    </div>
  )
}
