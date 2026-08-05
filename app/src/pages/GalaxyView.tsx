import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CelestialBody, RegionId } from '../types/lore'
import { GalaxyEngine, type GalaxyLane, type GalaxyNode } from '../lib/engine/galaxy-engine'
import { gridToPos, MANUAL_POS } from '../lib/galaxy-grid'
import { simClock } from '../lib/sim-clock'
import { factionById, L, loadAllPlanets, regions, rendersAsRubble } from '../lib/lore'
import { routes } from '../lib/routes'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import { useSearchParams } from 'react-router'
import TopBar from '../components/hud/TopBar'
import RoutePlanner from '../components/hud/RoutePlanner'
import LanePanel from '../components/hud/LanePanel'
import OnboardingHint from '../components/OnboardingHint'
import { useFlyTo } from '../components/useFlyTo'
import FactionOverlay from '../components/hud/FactionOverlay'
import { useRovingFocus } from '../hooks/useRovingFocus'

interface NodeLabel {
  id: string
  name: string
  x: number
  y: number
  depth: number
  visible: boolean
  destroyed: boolean
}

/** rough glyph metrics for the label chip, in CSS pixels */
const CHAR_W = 6.9
const ROW_H = 15
/** breathing room so two kept labels never read as one run of text */
const GUTTER = 6

/**
 * Greedy declutter: with 70+ worlds the labels overlap into unreadable runs, so
 * nearer worlds claim their box first and anything colliding with an already
 * placed label is dropped for that frame.
 */
function declutter(labels: NodeLabel[]): NodeLabel[] {
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = []
  const kept: NodeLabel[] = []
  for (const label of [...labels].filter((l) => l.visible).sort((a, b) => a.depth - b.depth)) {
    const halfW = (label.name.length * CHAR_W) / 2 + GUTTER
    const box = {
      x0: label.x - halfW,
      x1: label.x + halfW,
      y0: label.y - ROW_H / 2,
      y1: label.y + ROW_H / 2,
    }
    const clash = placed.some(
      (p) => box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0,
    )
    if (clash) continue
    placed.push(box)
    kept.push(label)
  }
  return kept
}

const NEUTRAL = '#8B94A7'

/** the charted lanes, ready for the engine. Stops carry canon grid cells, so
 *  the lane's shape follows the same placement rule the worlds do. */
const LANES: GalaxyLane[] = routes.map((route) => ({
  id: route.id,
  color: route.color,
  points: route.stops.map((stop) => gridToPos(stop.coordinates)),
}))

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
  const legends = useApp((s) => s.legends)
  const lanes = useApp((s) => s.lanes)
  const territory = useApp((s) => s.territory)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GalaxyEngine | null>(null)
  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const [labels, setLabels] = useState<NodeLabel[]>([])
  const [hoverRegion, setHoverRegion] = useState<RegionId | null>(null)
  const [fps, setFps] = useState(0)
  const flyTo = useFlyTo()
  // stable across renders, so handing it to the engine does not rebuild the scene
  const dive = useCallback(
    (id: string) => flyTo(`/planet/${id}`, () => engineRef.current?.flyToNode(id) ?? 0),
    [flyTo],
  )

  // the selected lane lives in the URL, so it is shareable and the back button
  // walks the selections
  const [searchParams, setSearchParams] = useSearchParams()
  const laneParam = searchParams.get('lane')
  const selectedLane = routes.some((r) => r.id === laneParam) ? laneParam : null

  const selectLane = useCallback(
    (id: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (id) next.set('lane', id)
        else next.delete('lane')
        return next
      })
    },
    [setSearchParams],
  )

  // the engine is built once per node set; routing the callback through a ref
  // keeps a lane selection from tearing the scene down and rebuilding it
  const selectLaneRef = useRef(selectLane)
  useEffect(() => {
    selectLaneRef.current = selectLane
  }, [selectLane])

  useEffect(() => {
    loadAllPlanets().then(setPlanets)
  }, [])

  // canon is always shown; Legends worlds only when the layer is switched on.
  // Shared by the WebGL nodes and the keyboard-accessible planet list.
  const visiblePlanets = useMemo(
    () => planets.filter((p) => legends || p.continuity !== 'legends'),
    [planets, legends],
  )

  const nodes = useMemo<GalaxyNode[]>(() => {
    if (!visiblePlanets.length) return []
    const states = nodeStates(visiblePlanets, useApp.getState().era)
    return visiblePlanets.map((p, i) => {
      // MANUAL_POS wins over the grid so R-5 Sith Worlds do not stack
      const pos = MANUAL_POS[p.id] ?? (p.coordinates ? gridToPos(p.coordinates) : { x: 0, z: 0 })
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
  }, [visiblePlanets, lang])

  useEffect(() => {
    if (!nodes.length || !canvasRef.current) return
    const engine = new GalaxyEngine(canvasRef.current, {
      getSimTime: () => simClock.getTime(),
      onFps: setFps,
      onSelect: dive,
      onLaneSelect: (routeId: string) => selectLaneRef.current(routeId),
      onLabelPositions: setLabels,
      onRegionHover: setHoverRegion,
    })
    engine.init(nodes, useApp.getState().era)
    engine.setLanes(LANES)
    engine.setLanesVisible(useApp.getState().lanes)
    engineRef.current = engine
    return () => {
      engineRef.current = null
      engine.dispose()
    }
  }, [nodes, dive])

  useEffect(() => {
    engineRef.current?.setLanesVisible(lanes)
  }, [lanes])

  useEffect(() => {
    engineRef.current?.setSelectedLane(selectedLane)
  }, [selectedLane, nodes])

  // lanes switched off take their selection with them: a panel for something
  // the map is no longer drawing is a panel about nothing
  useEffect(() => {
    if (!lanes && selectedLane) selectLane(null)
  }, [lanes, selectedLane, selectLane])

  // stable across renders: the planner would otherwise redraw every frame it
  // re-renders, and the effect that feeds it depends on this identity
  const showCourse = useCallback(
    (points: { x: number; z: number }[] | null) => engineRef.current?.setCourse(points),
    [],
  )

  // era switch: recolor nodes in place (no scene rebuild)
  useEffect(() => {
    if (!planets.length || !engineRef.current) return
    engineRef.current.applyNodeStates(nodeStates(planets, era), era)
  }, [era, planets])

  // both mirrors are long enough that a Tab stop per entry would bury the rest
  // of the page behind them: 23 lanes and every visible world
  const { ref: laneNavRef, onKeyDown: onLaneNavKey } = useRovingFocus<HTMLUListElement>()
  const { ref: planetNavRef, onKeyDown: onPlanetNavKey } = useRovingFocus<HTMLUListElement>()

  const regionName = hoverRegion
    ? L(regions.find((r) => r.id === hoverRegion)?.names, lang)
    : null

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      <canvas ref={canvasRef} className="h-full w-full" />
      {territory && <FactionOverlay era={era} lang={lang} />}
      <TopBar />
      <OnboardingHint />
      <RoutePlanner onCourse={showCourse} />

      {selectedLane && <LanePanel routeId={selectedLane} onClose={() => selectLane(null)} />}

      {/* The lane tubes cannot take focus either, so this mirrors the map's
          lanes the way the planet nav below mirrors its worlds. */}
      <nav aria-label={t('lanesNav', lang)} aria-describedby="lanes-nav-hint">
        <p id="lanes-nav-hint" className="sr-only">
          {t('arrowHint', lang)}
        </p>
        <ul ref={laneNavRef} onKeyDown={onLaneNavKey}>
          {routes.map((route) => (
            <li key={route.id}>
              <button
                data-roving-item
                onClick={() => selectLane(route.id)}
                className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-28 focus:z-40 focus:rounded focus:border focus:border-holo-cyan/50 focus:bg-panel/95 focus:px-3 focus:py-1.5 focus:text-[12px] focus:tracking-[0.15em] focus:text-holo-cyan focus:outline-none focus:ring-2 focus:ring-holo-cyan/60 focus:backdrop-blur-md"
              >
                {L(route.names, lang)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Keyboard/screen-reader access to the map: the WebGL nodes cannot take
          focus, so this stable, sorted list mirrors every visible world. Each
          entry is visually hidden until focused, then shows as a chip. */}
      <nav aria-label={t('planets', lang)} aria-describedby="planets-nav-hint">
        <p id="planets-nav-hint" className="sr-only">
          {t('arrowHint', lang)}
        </p>
        <ul ref={planetNavRef} onKeyDown={onPlanetNavKey}>
          {[...visiblePlanets]
            .sort((a, b) => L(a.names, lang).localeCompare(L(b.names, lang), lang))
            .map((p) => (
              <li key={p.id}>
                <button
                  data-roving-item
                  onClick={() => dive(p.id)}
                  className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-16 focus:z-40 focus:rounded focus:border focus:border-holo-cyan/50 focus:bg-panel/95 focus:px-3 focus:py-1.5 focus:text-[12px] focus:tracking-[0.15em] focus:text-holo-cyan focus:outline-none focus:ring-2 focus:ring-holo-cyan/60 focus:backdrop-blur-md"
                >
                  {L(p.names, lang)}
                </button>
              </li>
            ))}
        </ul>
      </nav>

      {regionName && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded border border-holo-cyan/20 bg-panel/80 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-holo-cyan backdrop-blur-sm">
          {regionName}
        </div>
      )}

      {declutter(labels).map(
        (label) => (
            <button
              key={label.id}
              // mouse-only: labels churn every frame as the map rotates, so
              // keyboard focus lives on the stable planet nav below instead
              tabIndex={-1}
              aria-hidden
              style={{ left: label.x, top: label.y }}
              onClick={() => dive(label.id)}
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
