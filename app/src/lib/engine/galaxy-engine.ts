// GalaxyEngine: oblique 3D galaxy disk — procedural spiral starfield, region
// bands, era-colored system nodes on the canon Galactic Atlas letter-number
// grid. Clicking a node hyperjumps to its star system.

import * as THREE from 'three'
import type { CelestialBody, EraId, RegionId } from '../../types/lore'
import { GALAXY_R, MANUAL_POS, gridToPos } from '../galaxy-grid'
import { EngineBase, type BaseCallbacks } from './engine-base'
import { makeBodyMaterial } from './body-material'
import { makeGlowTexture } from './effects'
import { getPlanetRotationHours } from '../../data/planet-rotations'
import { HAZE_FRAG, HAZE_VERT, STAR_FRAG, STAR_VERT } from './planet-shaders'

/** node globe radius in disk units — small enough to read as a point from the
 *  overview, large enough to resolve into a real world on approach */
const NODE_R = 0.17

/** lanes ride above the region rings and below the node sprites (y=0.12), so
 *  a world always reads as sitting on its lane rather than under it */
const LANE_Y = 0.05
const COURSE_Y = 0.2
/** curve samples per lane leg — enough to read as a flight path, not a zigzag */
const LANE_SAMPLES = 6
const COURSE_COLOR = '#ffe81f'
/** how far the rest of the network steps back while one lane is selected */
const SELECTED_LANE_DIM = 0.15

export interface GalaxyNode {
  id: string
  name: string
  /** disk-plane position in world units (see gridToPos) */
  x: number
  z: number
  color: string
  destroyed: boolean
  body: CelestialBody
}

/** One hyperlane, ready to draw: its stops in travel order. */
export interface GalaxyLane {
  id: string
  color: string
  points: { x: number; z: number }[]
}

export interface GalaxyCallbacks extends BaseCallbacks {
  onSelect?: (id: string) => void
  /** a click that landed on a lane rather than on a world */
  onLaneSelect?: (routeId: string) => void
  onLabelPositions?: (
    labels: {
      id: string
      name: string
      x: number
      y: number
      /** normalised device depth — nearer worlds win a contested label slot */
      depth: number
      visible: boolean
      destroyed: boolean
    }[],
  ) => void
  onRegionHover?: (region: RegionId | null) => void
}

// radial region bands as fraction of GALAXY_R (order matters: inner -> outer)
const REGION_BANDS: { id: RegionId; r: number }[] = [
  { id: 'deep-core', r: 0.1 },
  { id: 'core-worlds', r: 0.2 },
  { id: 'colonies', r: 0.28 },
  { id: 'inner-rim', r: 0.36 },
  { id: 'expansion-region', r: 0.44 },
  { id: 'mid-rim', r: 0.56 },
  { id: 'outer-rim', r: 0.76 },
  { id: 'wild-space', r: 0.9 },
]

/** tan(pitch angle) for the log spiral: ~24°, giving the disk a little under
 *  one full turn end to end. Tighter winds it into a whirlpool of rings. */
const SPIRAL_R0 = 2.0
const SPIRAL_B = 0.45

/** Box-Muller: clustered scatter, unlike the flat spread of Math.random() */
function gaussian(): number {
  const u = Math.max(Math.random(), 1e-6)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()) * 0.5
}

/** Soft irregular cloud used for nebula glow and dust. One shared texture: the
 *  per-sprite rotation and scale supply the variety. */
let nebulaTex: THREE.CanvasTexture | null = null
function nebulaTexture(): THREE.CanvasTexture {
  if (nebulaTex) return nebulaTex
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const ctx = cv.getContext('2d')!
  for (let i = 0; i < 9; i++) {
    const x = 40 + Math.random() * 48
    const y = 40 + Math.random() * 48
    const r = 18 + Math.random() * 34
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.42)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.14)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  // trim the square edges so the billboard never shows its own corners
  const mask = ctx.createRadialGradient(64, 64, 20, 64, 64, 64)
  mask.addColorStop(0, 'rgba(0,0,0,1)')
  mask.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = mask
  ctx.fillRect(0, 0, 128, 128)
  nebulaTex = new THREE.CanvasTexture(cv)
  nebulaTex.colorSpace = THREE.SRGBColorSpace
  return nebulaTex
}

/** Faction halo drawn behind a node's globe: a soft glow plus a thin targeting
 *  ring, so allegiance reads at a glance without hiding the world itself. */
const nodeTexCache = new Map<string, THREE.CanvasTexture>()
/** Legends-layer marker: worlds outside canon get a dashed gold outer ring so
 *  the layer reads as a distinct overlay rather than blending into canon. */
const LEGENDS_RING = '#e8c15a'
function makeNodeTexture(color: string, legends = false): THREE.CanvasTexture {
  const key = legends ? `${color}|legends` : color
  const hit = nodeTexCache.get(key)
  if (hit) return hit
  const cv = document.createElement('canvas')
  cv.width = cv.height = 64
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 6, 32, 32, 30)
  g.addColorStop(0, color)
  g.addColorStop(0.45, `${color}55`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.6
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.arc(32, 32, 23, 0, Math.PI * 2)
  ctx.stroke()
  if (legends) {
    ctx.strokeStyle = LEGENDS_RING
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.9
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(32, 32, 29, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  nodeTexCache.set(key, tex)
  return tex
}

function makeBrokenRingTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 64
  const ctx = cv.getContext('2d')!
  ctx.strokeStyle = '#c9563f'
  ctx.lineWidth = 5
  // shattered ring: three arcs with gaps
  for (const [a0, a1] of [
    [0.1, 1.6],
    [2.1, 3.4],
    [3.9, 5.6],
  ]) {
    ctx.beginPath()
    ctx.arc(32, 32, 20, a0, a1)
    ctx.stroke()
  }
  ctx.fillStyle = '#8a9099'
  for (const [dx, dy] of [
    [-6, 2],
    [5, -4],
    [1, 7],
  ]) {
    ctx.fillRect(30 + dx, 30 + dy, 4, 4)
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class GalaxyEngine extends EngineBase {
  private nodes: GalaxyNode[] = []
  private nodeSprites = new Map<string, THREE.Sprite>()
  private nodeGlobes = new Map<string, THREE.Mesh>()
  private era: EraId = 'empire'
  private hitTargets: THREE.Mesh[] = []
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private selectCb?: (id: string) => void
  private labelCb?: GalaxyCallbacks['onLabelPositions']
  private regionCb?: GalaxyCallbacks['onRegionHover']
  private laneCb?: GalaxyCallbacks['onLaneSelect']
  private lastRegion: RegionId | null = null
  private brokenTex = makeBrokenRingTexture()
  /** everything that turns with the disk: stars, haze, dust, bulge */
  private diskGroup = new THREE.Group()
  private spiral?: THREE.Points
  private spiralMat?: THREE.ShaderMaterial
  private coreMat?: THREE.ShaderMaterial
  private hazePoints?: THREE.Points
  private dustPoints?: THREE.Points
  private hazeMats: THREE.ShaderMaterial[] = []
  private coreGlows: THREE.Sprite[] = []
  /** 1 in the overview, eased to 0 while diving at a world so the disk's own
   *  point sprites do not blow up into blobs at close range */
  private diskFade = 1
  private diving = false
  /** the charted hyperlane network, and the course plotted across it */
  private laneGroup = new THREE.Group()
  private laneMats: THREE.Material[] = []
  /** invisible tubes along each lane: a line is too thin to hit, especially
   *  under a finger, so the pickable lane is a volume around the drawn one */
  private laneHits: THREE.Mesh[] = []
  private selectedLane: string | null = null
  private courseGroup = new THREE.Group()
  /** lanes step back while a course is plotted, so the course reads as the
   *  answer rather than as one more line in the network */
  private courseDim = 1
  private comet?: THREE.Sprite
  private cometStart = 6
  private cometFrom = new THREE.Vector3()
  private cometTo = new THREE.Vector3()

  constructor(canvas: HTMLCanvasElement, cb: GalaxyCallbacks) {
    super(canvas, cb)
    this.selectCb = cb.onSelect
    this.labelCb = cb.onLabelPositions
    this.regionCb = cb.onRegionHover
    this.laneCb = cb.onLaneSelect
  }

  init(nodes: GalaxyNode[], era: EraId) {
    this.nodes = nodes
    this.era = era
    this.initGL(new THREE.Vector3(0, 26, 31), 0.45)
    this.controls.minDistance = 2
    this.controls.maxDistance = 62
    this.controls.maxPolarAngle = 1.32
    this.controls.target.set(0, 0, 1.5)
    this.addStarfield(1600)
    this.buildDisk()
    this.buildRegionRings()
    this.scene.add(this.laneGroup)
    this.scene.add(this.courseGroup)
    this.buildNodes()
    this.buildComet()
    this.stampBaseOpacity()
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.start()
  }

  /** re-tint nodes when the era changes (no rebuild) */
  applyNodeStates(states: { id: string; color: string; destroyed: boolean }[], era: EraId) {
    this.era = era
    for (const s of states) {
      const sprite = this.nodeSprites.get(s.id)
      const node = this.nodes.find((n) => n.id === s.id)
      if (!sprite || !node) continue
      node.color = s.color
      node.destroyed = s.destroyed
      const mat = sprite.material as THREE.SpriteMaterial
      mat.map = s.destroyed
        ? this.brokenTex
        : makeNodeTexture(s.color, node.body.continuity === 'legends')
      mat.blending = s.destroyed ? THREE.NormalBlending : THREE.AdditiveBlending
      mat.needsUpdate = true
      // a destroyed world loses its globe; era variants (Starkiller) switch in
      const globe = this.nodeGlobes.get(s.id)
      if (globe) {
        globe.visible = !s.destroyed
        const gm = globe.material as THREE.ShaderMaterial
        gm.uniforms.uVariant.value = node.body.renderRecipe.variantsByEra?.[era] ? 1 : 0
      }
    }
  }

  /**
   * Draw the hyperlane network. A lane is a curve through its stops rather
   * than a chain of segments: the stops are real coordinates, but ships do not
   * fly a polyline, and the corners of one read as a wiring diagram.
   */
  setLanes(lanes: GalaxyLane[]) {
    this.disposeGroup(this.laneGroup)
    this.laneMats = []
    this.laneHits = []
    for (const lane of lanes) {
      if (lane.points.length < 2) continue
      const geo = new THREE.BufferGeometry().setFromPoints(this.laneCurve(lane.points, LANE_Y))
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(lane.color),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      mat.userData.baseOpacity = mat.opacity
      mat.userData.routeId = lane.id
      this.laneMats.push(mat)
      this.laneGroup.add(new THREE.Line(geo, mat))

      // a tick at every stop: the curve between them is our drawing, but the
      // stops themselves are canon and should be visible as such
      const ticks = new THREE.BufferGeometry().setFromPoints(
        lane.points.map((p) => new THREE.Vector3(p.x, LANE_Y, p.z)),
      )
      const tickMat = new THREE.PointsMaterial({
        color: new THREE.Color(lane.color),
        size: 0.14,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      tickMat.userData.baseOpacity = tickMat.opacity
      tickMat.userData.routeId = lane.id
      this.laneMats.push(tickMat)
      this.laneGroup.add(new THREE.Points(ticks, tickMat))

      // the same curve the line follows, given a radius. Radial segments are
      // as low as a tube goes: it is never drawn, only hit.
      const hitGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(this.laneCurve(lane.points, LANE_Y)),
        lane.points.length * LANE_SAMPLES,
        0.45,
        4,
        false,
      )
      const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }))
      hitMesh.userData.routeId = lane.id
      this.laneGroup.add(hitMesh)
      this.laneHits.push(hitMesh)
    }
    this.applyDiskFade()
  }

  setLanesVisible(visible: boolean) {
    this.laneGroup.visible = visible
  }

  /** Bring one lane forward and step the rest back. Passing null clears it. */
  setSelectedLane(routeId: string | null) {
    this.selectedLane = routeId
    this.applyDiskFade()
  }

  /** Highlight one plotted course over the lanes. Passing null clears it. */
  setCourse(points: { x: number; z: number }[] | null) {
    this.disposeGroup(this.courseGroup)
    this.courseDim = points && points.length >= 2 ? 0.35 : 1
    this.applyDiskFade()
    if (!points || points.length < 2) return
    const path = this.laneCurve(points, COURSE_Y)
    // a tube, not a line: line width is not portable across platforms, and the
    // plotted course is the one thing on the map that has to stand out
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), path.length, 0.2, 6, false)
    const course = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(COURSE_COLOR),
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        // drawn over everything: a course that disappears behind the core glow
        // is not an answer to "how do I get there"
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    course.renderOrder = 6
    this.courseGroup.add(course)
  }

  /** stops -> a smooth path through them, sampled for drawing */
  private laneCurve(points: { x: number; z: number }[], y: number): THREE.Vector3[] {
    const control = points.map((p) => new THREE.Vector3(p.x, y, p.z))
    if (control.length < 3) return control
    // centripetal parameterisation: where two stops nearly share a grid cell,
    // the chordal default loops the curve out into a bubble
    const curve = new THREE.CatmullRomCurve3(control, false, 'centripetal')
    return curve.getPoints((control.length - 1) * LANE_SAMPLES)
  }

  private disposeGroup(group: THREE.Group) {
    for (const child of [...group.children]) {
      group.remove(child)
      const drawn = child as THREE.Mesh | THREE.Line | THREE.Points
      drawn.geometry?.dispose()
      const mat = drawn.material
      if (Array.isArray(mat)) for (const m of mat) m.dispose()
      else mat?.dispose()
    }
  }

  /** Dive at one world: the camera closes on its globe while the disk's own
   *  starfield fades out, so the arrival framing matches the planet view. */
  flyToNode(id: string): number {
    const globe = this.nodeGlobes.get(id)
    const node = this.nodes.find((n) => n.id === id)
    if (!node) return 0
    const pos = globe
      ? globe.position.clone()
      : new THREE.Vector3(node.x, 0.12, node.z)
    this.diving = true
    // planet view frames a unit sphere from 5.4 units out; match that ratio
    return this.flyTo(() => pos, NODE_R * 5.4, 1250)
  }

  private stampBaseOpacity() {
    const sprites = [...this.coreGlows, ...this.nodeSprites.values()] as THREE.Sprite[]
    for (const sprite of sprites) {
      const mat = sprite.material as THREE.SpriteMaterial
      mat.userData.baseOpacity = mat.opacity
    }
  }

  /** every disk material keeps its authored opacity in userData.baseOpacity, so
   *  the dive fade scales them all without flattening the layering */
  private applyDiskFade() {
    if (this.spiralMat) this.spiralMat.uniforms.uOpacity.value = this.diskFade
    if (this.coreMat) this.coreMat.uniforms.uOpacity.value = this.diskFade
    for (const mat of this.hazeMats) mat.uniforms.uOpacity.value = this.diskFade
    const sprites = [...this.coreGlows, ...this.nodeSprites.values()] as THREE.Sprite[]
    for (const sprite of sprites) {
      const mat = sprite.material as THREE.SpriteMaterial
      mat.opacity = (mat.userData.baseOpacity as number) * this.diskFade
    }
    for (const mat of this.laneMats) {
      const off =
        this.selectedLane && mat.userData.routeId !== this.selectedLane ? SELECTED_LANE_DIM : 1
      mat.opacity = (mat.userData.baseOpacity as number) * this.diskFade * this.courseDim * off
    }
    this.courseGroup.visible = this.diskFade > 0.01
  }

  private buildDisk() {
    this.scene.add(this.diskGroup)
    this.buildArmStars()
    this.buildNebulaHaze()
    this.buildDustLanes()
    this.buildCore()
    this.buildLandmarks()
  }

  /** Resolved stars. Arms follow a logarithmic spiral (r = r0·e^(bθ)) at a
   *  ~12° pitch, with a field-star population filling the space between them —
   *  isolated ribbons of dots are what made the disk read as confetti. */
  private buildArmStars() {
    const N = this.quality.galaxyStars
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const phase = new Float32Array(N)
    const c = new THREE.Color()
    const warm = new THREE.Color('#ffd5a4')
    const mid = new THREE.Color('#f4f2ff')
    const cool = new THREE.Color('#a9c4ff')
    const giant = new THREE.Color('#ff9a6b')
    const hii = new THREE.Color('#ff86a8')

    for (let i = 0; i < N; i++) {
      // 22% sit outside the arms entirely: an inter-arm haze of older stars
      const field = i % 9 === 0 || i % 9 === 1
      const t = Math.pow(Math.random(), field ? 0.5 : 0.62)
      const r = GALAXY_R * (0.06 + t * 0.92)
      let theta: number
      if (field) {
        theta = Math.random() * Math.PI * 2
      } else {
        // two major arms plus two shorter spurs, as the canon disk is drawn
        theta = this.armAngle(i % 4, r, 0.14 + t * 0.3)
      }
      // the disk is thin and flares gently outward
      const y = gaussian() * GALAXY_R * 0.012 * (1 + t * 1.6)
      pos.set([Math.cos(theta) * r, y, Math.sin(theta) * r], i * 3)

      const rank = Math.pow(Math.random(), 2.4) // few bright, many faint
      const roll = Math.random()
      if (roll > 0.972) c.copy(giant)
      else if (!field && roll > 0.955) c.copy(hii)
      else c.copy(warm).lerp(mid, Math.min(t * 2.1, 1)).lerp(cool, Math.max(0, t - 0.5) * 1.7)
      c.multiplyScalar(0.18 + rank * 0.62)
      col.set([c.r, c.g, c.b], i * 3)
      size[i] = (0.2 + rank * 0.95) * (roll > 0.972 ? 1.7 : 1)
      phase[i] = Math.random() < 0.12 ? Math.random() : 0
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: {
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uTime: { value: 0 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.timedMats.push(mat)
    this.spiralMat = mat
    this.spiral = new THREE.Points(geo, mat)
    this.spiral.frustumCulled = false
    this.diskGroup.add(this.spiral)
  }

  /** Unresolved light. A real galaxy is mostly glow the eye cannot separate
   *  into stars; these soft billboards supply it and carry the arm color. */
  private buildNebulaHaze() {
    const N = this.quality.galaxyStars > 20000 ? 1800 : 600
    const warm = new THREE.Color('#ffc48c')
    const pale = new THREE.Color('#cdd8ff')
    const cool = new THREE.Color('#7fa4f0')
    const hii = new THREE.Color('#ff6f96')
    const c = new THREE.Color()
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const alpha = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const t = Math.pow(Math.random(), 0.55)
      const r = GALAXY_R * (0.08 + t * 0.78)
      const theta = this.armAngle(i % 4, r, 0.16 + t * 0.22)
      pos.set([Math.cos(theta) * r, gaussian() * 0.12, Math.sin(theta) * r], i * 3)
      if (Math.random() > 0.94) c.copy(hii)
      else c.copy(warm).lerp(pale, Math.min(t * 2.4, 1)).lerp(cool, Math.max(0, t - 0.55) * 1.2)
      col.set([c.r, c.g, c.b], i * 3)
      // a wide spread of puff sizes is what stops them reading as blobs, and
      // the outer disk gets smaller ones so the haze does not spill off the rim
      size[i] = (7 + Math.pow(Math.random(), 2.2) * 34) * (1 - t * 0.45)
      alpha[i] = (0.006 + Math.random() * 0.013) * (1 - Math.pow(t, 3) * 0.75)
    }
    this.hazePoints = this.makeHazePoints(pos, col, size, alpha, THREE.AdditiveBlending)
    this.diskGroup.add(this.hazePoints)
  }

  /** Dark lanes on the inner edge of each arm, drawn after the glow so they
   *  actually subtract from it. */
  private buildDustLanes() {
    const N = this.quality.galaxyStars > 20000 ? 1200 : 400
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const alpha = new Float32Array(N)
    const lane = new THREE.Color('#04060b')
    for (let i = 0; i < N; i++) {
      const t = 0.16 + Math.pow(Math.random(), 0.8) * 0.78
      const r = GALAXY_R * t * 0.95
      const theta = this.armAngle(i % 4, r, 0.06) - 0.13
      pos.set([Math.cos(theta) * r, 0.05, Math.sin(theta) * r], i * 3)
      col.set([lane.r, lane.g, lane.b], i * 3)
      size[i] = 4 + Math.pow(Math.random(), 1.9) * 15
      alpha[i] = 0.06 + Math.random() * 0.12
    }
    this.dustPoints = this.makeHazePoints(pos, col, size, alpha, THREE.NormalBlending)
    this.dustPoints.renderOrder = 2
    this.diskGroup.add(this.dustPoints)
  }

  /** Log-spiral angle for an arm at radius r, with gaussian cross-arm scatter. */
  private armAngle(arm: number, r: number, spread: number): number {
    return (
      arm * (Math.PI / 2) +
      (arm % 2 === 1 ? 0.3 : 0) +
      Math.log(Math.max(r, SPIRAL_R0) / SPIRAL_R0) / SPIRAL_B +
      gaussian() * spread
    )
  }

  private makeHazePoints(
    pos: Float32Array,
    col: Float32Array,
    size: Float32Array,
    alpha: Float32Array,
    blending: THREE.Blending,
  ): THREE.Points {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: HAZE_VERT,
      fragmentShader: HAZE_FRAG,
      uniforms: {
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending,
    })
    this.hazeMats.push(mat)
    const points = new THREE.Points(geo, mat)
    points.frustumCulled = false
    return points
  }

  /** Barred bulge: a dense triaxial swarm plus two restrained glows. A single
   *  bright sprite here just blows out to a white ball under bloom. */
  private buildCore() {
    const N = this.quality.galaxyStars > 20000 ? 4200 : 1600
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const phase = new Float32Array(N)
    const c = new THREE.Color()
    const bar = 0.42 // bar tilt in radians
    for (let i = 0; i < N; i++) {
      const rr = Math.pow(Math.random(), 1.9) * GALAXY_R * 0.19
      const a = Math.random() * Math.PI * 2
      const x0 = Math.cos(a) * rr
      const z0 = Math.sin(a) * rr * 0.42
      pos.set(
        [
          x0 * Math.cos(bar) - z0 * Math.sin(bar),
          gaussian() * GALAXY_R * 0.012,
          x0 * Math.sin(bar) + z0 * Math.cos(bar),
        ],
        i * 3,
      )
      const rank = Math.pow(Math.random(), 2.2)
      c.setHSL(0.09 - Math.random() * 0.03, 0.45, 0.6 + rank * 0.35)
      c.multiplyScalar(0.26 + rank * 0.5)
      col.set([c.r, c.g, c.b], i * 3)
      size[i] = 0.22 + rank * 0.8
      phase[i] = 0
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: {
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uTime: { value: 0 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.timedMats.push(mat)
    this.coreMat = mat
    const bulge = new THREE.Points(geo, mat)
    bulge.frustumCulled = false
    this.diskGroup.add(bulge)

    for (const [scale, opacity, tint] of [
      [0.3, 0.17, '#ffbe78'],
      [0.11, 0.2, '#ffe0b0'],
    ] as [number, number, string][]) {
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeGlowTexture(tint),
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity,
        }),
      )
      glow.scale.setScalar(GALAXY_R * scale)
      this.coreGlows.push(glow)
      this.diskGroup.add(glow)
    }
  }

  /** Two named oddities that are not part of the disk itself. */
  private buildLandmarks() {
    const islet = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaTexture(),
        color: new THREE.Color('#b49ac8'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.4,
      }),
    )
    islet.scale.setScalar(GALAXY_R * 0.2)
    islet.position.set(MANUAL_POS.peridea.x, -0.2, MANUAL_POS.peridea.z)
    this.scene.add(islet)

    const maelstrom = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaTexture(),
        color: new THREE.Color('#6d84a4'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.3,
      }),
    )
    const kesselPos = gridToPos('T-10')
    maelstrom.scale.setScalar(GALAXY_R * 0.16)
    maelstrom.position.set(kesselPos.x + 0.6, 0.1, kesselPos.z)
    this.scene.add(maelstrom)
  }

  private buildRegionRings() {
    for (const band of REGION_BANDS) {
      const pts: THREE.Vector3[] = []
      for (let a = 0; a <= 220; a++) {
        const t = (a / 220) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(t) * band.r * GALAXY_R, 0.02, Math.sin(t) * band.r * GALAXY_R))
      }
      this.scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x24303f, transparent: true, opacity: 0.55 }),
        ),
      )
    }
    // Unknown Regions boundary: a soft arc fencing the west
    const pts: THREE.Vector3[] = []
    for (let a = 0; a <= 80; a++) {
      const t = Math.PI * 0.62 + (a / 80) * Math.PI * 0.76
      pts.push(new THREE.Vector3(Math.cos(t) * 0.5 * GALAXY_R, 0.02, Math.sin(t) * 0.5 * GALAXY_R))
    }
    this.scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x3a3450, transparent: true, opacity: 0.7 }),
      ),
    )
  }

  private buildNodes() {
    for (const node of this.nodes) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: node.destroyed
            ? this.brokenTex
            : makeNodeTexture(node.color, node.body.continuity === 'legends'),
          blending: node.destroyed ? THREE.NormalBlending : THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        }),
      )
      sprite.scale.setScalar(0.82)
      sprite.position.set(node.x, 0.12, node.z)
      this.scene.add(sprite)
      this.nodeSprites.set(node.id, sprite)

      // the world itself, lit from the galactic core — a real surface even at
      // overview scale, so approaching it resolves rather than swaps
      const toCore = new THREE.Vector3(-node.x, 0.35, -node.z)
      if (toCore.lengthSq() < 1e-6) toCore.set(0, 1, 0)
      const globeMat = makeBodyMaterial(
        node.body,
        this.era,
        [{ dir: toCore.normalize(), color: new THREE.Color(node.body.suns?.[0]?.color ?? '#FFEFD0') }],
        0,
      )
      this.timedMats.push(globeMat)
      const globe = new THREE.Mesh(new THREE.SphereGeometry(NODE_R, 24, 16), globeMat)
      globe.position.copy(sprite.position)
      globe.visible = !node.destroyed
      this.scene.add(globe)
      this.nodeGlobes.set(node.id, globe)

      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      )
      hit.position.copy(sprite.position)
      hit.userData.bodyId = node.id
      this.scene.add(hit)
      this.hitTargets.push(hit)
    }
  }

  private buildComet() {
    this.comet = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('#cfe8ff'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    )
    this.comet.scale.set(0.7, 0.08, 1)
    this.scene.add(this.comet)
  }

  private regionAt(x: number, z: number): RegionId | null {
    // far-galaxy islet first
    const dxP = x - MANUAL_POS.peridea.x
    const dzP = z - MANUAL_POS.peridea.z
    if (Math.hypot(dxP, dzP) < GALAXY_R * 0.16) return 'far-galaxy'
    const r = Math.hypot(x, z) / GALAXY_R
    if (r > 0.97) return null
    // western sector beyond the mid rim is the Unknown Regions
    if (x < -GALAXY_R * 0.38 && r > 0.42) return 'unknown-regions'
    for (const band of REGION_BANDS) {
      if (r <= band.r) return band.id
    }
    return null
  }

  private setPointer(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)
  }

  /** the lane under the pointer, or null. Lanes switched off are not there to
   *  be hit, and a world sitting on its lane always wins the click. */
  private laneUnderPointer(): string | null {
    if (!this.laneGroup.visible) return null
    const hit = this.raycaster.intersectObjects(this.laneHits, false)
    return (hit[0]?.object.userData.routeId as string | undefined) ?? null
  }

  private onPointerMove = (e: PointerEvent) => {
    this.setPointer(e)
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)
    this.canvas.style.cursor = hit.length || this.laneUnderPointer() ? 'pointer' : 'grab'
    if (this.regionCb) {
      const target = new THREE.Vector3()
      const on = this.raycaster.ray.intersectPlane(this.plane, target)
      const region = on ? this.regionAt(target.x, target.z) : null
      if (region !== this.lastRegion) {
        this.lastRegion = region
        this.regionCb(region)
      }
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    this.setPointer(e)
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)
    const id = hit[0]?.object.userData.bodyId as string | undefined
    if (id) {
      this.selectCb?.(id)
      return
    }
    const routeId = this.laneUnderPointer()
    if (routeId) this.laneCb?.(routeId)
  }

  protected update() {
    // near-imperceptible rotation keeps the whole disk alive as one body
    this.diskGroup.rotation.y = this.wallSec * 0.004

    // worlds turn on their own axes calibrated to their canon rotational periods
    for (const [id, globe] of this.nodeGlobes) {
      const rotHours = getPlanetRotationHours(id)
      globe.rotation.y = this.wallSec * (0.05 * (24 / rotHours))
    }

    // clear the disk out of the way once a dive starts
    const wanted = this.diving ? 0 : 1
    if (this.diskFade !== wanted) {
      this.diskFade += Math.sign(wanted - this.diskFade) * 0.045
      this.diskFade = THREE.MathUtils.clamp(this.diskFade, 0, 1)
      this.applyDiskFade()
    }

    // stray comet: a rare streak crossing the outer disk
    if (this.comet) {
      const t = this.wallSec - this.cometStart
      const mat = this.comet.material as THREE.SpriteMaterial
      if (t < 0) {
        mat.opacity = 0
      } else if (t < 4) {
        if (t < 0.05 && mat.opacity === 0) {
          const a = Math.random() * Math.PI * 2
          this.cometFrom.set(Math.cos(a) * GALAXY_R * 1.1, 0.4, Math.sin(a) * GALAXY_R * 1.1)
          this.cometTo.set(Math.cos(a + 2.2) * GALAXY_R * 0.7, 0.4, Math.sin(a + 2.2) * GALAXY_R * 0.7)
        }
        const k = t / 4
        this.comet.position.lerpVectors(this.cometFrom, this.cometTo, k)
        mat.opacity = Math.sin(Math.min(k, 1) * Math.PI) * 0.75
      } else {
        mat.opacity = 0
        this.cometStart = this.wallSec + 9 + Math.random() * 14
      }
    }

    if (this.labelCb) {
      const half = { w: this.canvas.clientWidth / 2, h: this.canvas.clientHeight / 2 }
      const camDist = this.camera.position.length()
      this.labelCb(
        this.nodes.map((n) => {
          const sprite = this.nodeSprites.get(n.id)!
          const proj = sprite.position.clone().project(this.camera)
          return {
            id: n.id,
            name: n.name,
            x: proj.x * half.w + half.w,
            y: -proj.y * half.h + half.h - 16,
            depth: proj.z,
            visible: proj.z < 1 && camDist < 56 && !this.diving,
            destroyed: n.destroyed,
          }
        }),
      )
    }
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.disposeGroup(this.laneGroup)
    this.disposeGroup(this.courseGroup)
    super.dispose()
  }
}
