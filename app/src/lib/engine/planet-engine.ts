// PlanetEngine: the close-up "globe" view — one celestial body with archetype
// shader surface, atmosphere, clouds, rings, orbiting moons and its sun(s).
// Era-aware: destroyed worlds render as asteroid graveyards, Ilum gains its
// Starkiller trench, Death Stars appear in orbit only in their era.
// Rotation runs on simulated time; effect shaders run on wall-clock time.

import * as THREE from 'three'
import type { CelestialBody, EraId } from '../../types/lore'
import { rendersAsRubble, stationsForHost } from '../lore'
import { EngineBase, type BaseCallbacks } from './engine-base'
import {
  buildAuroras,
  buildAsteroidField,
  buildDeathStar,
  buildLightningColumns,
  buildMistShell,
  buildSparks,
  buildTraffic,
  type TrafficSystem,
} from './effects'
import {
  ARCHETYPE_IDS,
  ATMO_FRAG,
  ATMO_VERT,
  CLOUD_FRAG,
  CLOUD_VERT,
  PLANET_FRAG,
  PLANET_VERT,
  RING_FRAG,
  RING_VERT,
} from './planet-shaders'

export interface PoiScreenPos {
  id: string
  x: number
  y: number
  visible: boolean
}

export interface PlanetCallbacks extends BaseCallbacks {
  onPoiPositions?: (positions: PoiScreenPos[]) => void
}

const CLOUD_DENSITY: Record<string, number> = { temperate: 0.45, storm: 0.5, sickly: 0.3 }
const CLOUD_TINT: Record<string, string> = {
  temperate: '#ffffff',
  storm: '#e8ecf2',
  sickly: '#cfd0a0',
}
const CLOUD_SPEED: Record<string, number> = { temperate: 0.0045, storm: 0.011, sickly: 0.0028 }

const CAM_DIR = new THREE.Vector3(0, 0.55, 3.1).normalize()
const CAM_NEAR = 3.15
const CAM_FAR = 8.2
const INTRO_MS = 1200
const DEPART_MS = 620

function seedFrom(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return h / 100
}

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon + 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInCubic = (t: number) => t * t * t

export class PlanetEngine extends EngineBase {
  private body!: CelestialBody
  private era: EraId = 'empire'
  private planetGroup = new THREE.Group()
  private planetMesh?: THREE.Mesh
  private moonOrbiters: { obj: THREE.Object3D; radius: number; periodDays: number; phase: number }[] = []
  private sunDirs: { dir: THREE.Vector3; color: THREE.Color }[] = []
  private poiLocal: { id: string; pos: THREE.Vector3 }[] = []
  private poiCb?: (p: PoiScreenPos[]) => void
  private rotationHours = 24
  private asteroidUpdate?: (dt: number) => void
  private traffic?: TrafficSystem
  private lastWall = 0
  private introStart = -1
  private departStart = -1
  private departFromDist = CAM_NEAR

  constructor(canvas: HTMLCanvasElement, cb: PlanetCallbacks) {
    super(canvas, cb)
    this.poiCb = cb.onPoiPositions
  }

  init(body: CelestialBody, era: EraId) {
    this.body = body
    this.era = era
    this.initGL(CAM_DIR.clone().multiplyScalar(this.reducedMotion ? CAM_NEAR : CAM_FAR), 0.55)
    this.controls.minDistance = 1.5
    this.controls.maxDistance = 14
    this.addStarfield(900)
    this.buildSuns()

    if (rendersAsRubble(body, era)) {
      this.buildGraveyard()
    } else if (body.kind === 'station') {
      this.buildStationBody()
    } else {
      this.buildPlanet()
      this.buildMoons()
      this.buildOrbitingStations()
      this.buildArchetypeEffects()
    }

    if (!this.reducedMotion) this.introStart = performance.now()
    this.start()
  }

  /** camera pull-back before a hyperspace jump; call right before navigating */
  depart() {
    if (this.reducedMotion) return
    this.departFromDist = this.camera.position.length()
    this.departStart = performance.now()
    this.introStart = -1
  }

  private buildSuns() {
    const suns = this.body.suns?.length
      ? this.body.suns
      : [{ name: 'Sun', color: '#FFEFD0' }]
    // primary sun to the camera-side right — day face greets the viewer,
    // terminator sweeps the left limb; twin suns sit a few degrees apart
    suns.slice(0, 2).forEach((sun, i) => {
      const angle = 0.45 + i * 0.09
      const dir = new THREE.Vector3(Math.cos(angle), 0.22 + i * 0.05, Math.sin(angle) * 0.9).normalize()
      this.sunDirs.push({ dir, color: new THREE.Color(sun.color) })
      const sprite = this.makeSunSprite(sun.color, 26 - i * 8)
      sprite.position.copy(dir.clone().multiplyScalar(240))
      this.scene.add(sprite)
    })
  }

  private makeBodyMaterial(body: CelestialBody, seed: number): THREE.ShaderMaterial {
    const recipe = body.renderRecipe
    const [s1, s2] = [this.sunDirs[0], this.sunDirs[1] ?? this.sunDirs[0]]
    const mat = new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
      uniforms: {
        uArchetype: { value: ARCHETYPE_IDS[recipe.archetype] ?? 10 },
        uSeed: { value: seed },
        uTime: { value: 0 },
        uPrimary: { value: new THREE.Color(recipe.palette.primary) },
        uSecondary: { value: new THREE.Color(recipe.palette.secondary ?? recipe.palette.primary) },
        uAtmoColor: { value: new THREE.Color(recipe.atmosphere?.color ?? '#88aaff') },
        uSun1Dir: { value: s1.dir },
        uSun1Color: { value: s1.color },
        uSun2Dir: { value: s2.dir },
        uSun2Color: { value: s2.color },
        uHasSun2: { value: this.sunDirs.length > 1 ? 1 : 0 },
        uVariant: { value: recipe.variantsByEra?.[this.era] ? 1 : 0 },
        uAlbedo: { value: null },
        uUseAlbedo: { value: 0 },
        uNight: { value: null },
        uUseNight: { value: 0 },
      },
    })
    this.timedMats.push(mat)
    return mat
  }

  private buildPlanet() {
    const recipe = this.body.renderRecipe
    const seed = seedFrom(this.body.id)
    this.rotationHours = this.body.stats?.diameterKm ? 20 + (seedFrom(this.body.id) % 12) : 24

    const geo = new THREE.SphereGeometry(1, 128, 128)
    this.planetMesh = new THREE.Mesh(geo, this.makeBodyMaterial(this.body, seed))
    this.planetGroup.add(this.planetMesh)
    this.scene.add(this.planetGroup)
    const [s1, s2] = [this.sunDirs[0], this.sunDirs[1] ?? this.sunDirs[0]]

    // atmosphere shell
    if (recipe.atmosphere) {
      const atmoMat = new THREE.ShaderMaterial({
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(recipe.atmosphere.color) },
          uDensity: { value: recipe.atmosphere.density },
          uTime: { value: 0 },
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      })
      this.timedMats.push(atmoMat)
      this.planetGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1.045, 64, 64), atmoMat))
    }

    // cloud layer
    const cloudsKind = recipe.textures?.clouds
    if (cloudsKind) {
      const cloudMat = new THREE.ShaderMaterial({
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: seed + 3.7 },
          uDensity: { value: CLOUD_DENSITY[cloudsKind] ?? 0.45 },
          uSpeed: { value: CLOUD_SPEED[cloudsKind] ?? 0.0045 },
          uTint: { value: new THREE.Color(CLOUD_TINT[cloudsKind] ?? '#ffffff') },
          uSun1Dir: { value: s1.dir },
          uSun1Color: { value: s1.color },
          uSun2Dir: { value: s2.dir },
          uSun2Color: { value: s2.color },
          uHasSun2: { value: this.sunDirs.length > 1 ? 1 : 0 },
        },
        transparent: true,
        depthWrite: false,
      })
      this.timedMats.push(cloudMat)
      this.planetGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1.014, 96, 96), cloudMat))
    }

    // rings
    if (recipe.rings) {
      const { innerRadius, outerRadius, tilt, kind } = recipe.rings
      const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 180, 1)
      // remap uv.x to radial 0..1 for the shader
      const uv = ringGeo.attributes.uv as THREE.BufferAttribute
      const pos = ringGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < uv.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const r = (Math.hypot(x, y) - innerRadius) / (outerRadius - innerRadius)
        uv.setXY(i, r, 0.5)
      }
      const ringMat = new THREE.ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(kind === 'bone' ? '#d8d0c0' : '#b09878') },
          uSeed: { value: seed },
          uBone: { value: kind === 'bone' ? 1 : 0 },
          uSun1Dir: { value: s1.dir },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2 + THREE.MathUtils.degToRad(tilt)
      this.scene.add(ring)
    }

    // POI anchor points in planet-local space
    this.poiLocal = (this.body.poi ?? []).map((p) => ({
      id: p.id,
      pos: latLonToVec3(p.lat, p.lon, 1.015),
    }))
  }

  /** the viewed body IS a station (Death Star pages) */
  private buildStationBody() {
    const half = (this.body.renderRecipe.effects ?? []).includes('half-built-scaffold')
    const ds = buildDeathStar(1, half, seedFrom(this.body.id))
    const s1 = this.sunDirs[0]
    for (const m of ds.materials) {
      ;(m.uniforms.uSun1Dir.value as THREE.Vector3).copy(s1.dir)
      ;(m.uniforms.uSun1Color.value as THREE.Color).copy(s1.color)
    }
    this.timedMats.push(...ds.materials)
    this.planetGroup.add(ds.object)
    this.scene.add(this.planetGroup)
    this.rotationHours = 160 // stations barely rotate
  }

  /** destroyed world: asteroid graveyard instead of a globe */
  private buildGraveyard() {
    const s1 = this.sunDirs[0]
    const field = buildAsteroidField(650, 0.7, 2.3, s1.dir, s1.color)
    this.scene.add(field.object)
    this.asteroidUpdate = field.update
  }

  private buildMoons() {
    const detail = this.body.moonsDetail ?? []
    const plainNames = this.body.moons ?? []
    // detailed moons render with their real recipes; leftovers get muted rock
    const total = Math.min(Math.max(detail.length, plainNames.length, this.body.stats?.moonCount ?? 0), 4)
    for (let i = 0; i < total; i++) {
      const det = detail[i]
      const size = det ? 0.13 : 0.045 + (i % 3) * 0.02
      let mesh: THREE.Mesh
      if (det) {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 48, 48),
          this.makeBodyMaterial(det, seedFrom(det.id)),
        )
      } else {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 24, 24),
          new THREE.MeshBasicMaterial({ color: new THREE.Color('#9a938c') }),
        )
      }
      this.scene.add(mesh)
      const radius = 2.1 + i * 0.75
      this.moonOrbiters.push({
        obj: mesh,
        radius,
        periodDays: 4 + i * 6,
        phase: (i * Math.PI * 2) / Math.max(total, 1) + seedFrom(this.body.id),
      })
      this.addOrbitLine(radius)
    }
  }

  /** Death Stars & co. in orbit, era-gated */
  private buildOrbitingStations() {
    const stations = stationsForHost(this.body.id, this.era)
    stations.forEach((station, i) => {
      const half = (station.renderRecipe.effects ?? []).includes('half-built-scaffold')
      const ds = buildDeathStar(0.2, half, seedFrom(station.id))
      const s1 = this.sunDirs[0]
      for (const m of ds.materials) {
        ;(m.uniforms.uSun1Dir.value as THREE.Vector3).copy(s1.dir)
        ;(m.uniforms.uSun1Color.value as THREE.Color).copy(s1.color)
      }
      this.timedMats.push(...ds.materials)
      this.scene.add(ds.object)
      const radius = 3.1 + i * 0.6
      this.moonOrbiters.push({
        obj: ds.object,
        radius,
        periodDays: 18 + i * 7,
        phase: 1.1 + i,
      })
      this.addOrbitLine(radius)
    })
  }

  private addOrbitLine(radius: number) {
    const pts: THREE.Vector3[] = []
    for (let a = 0; a <= 128; a++) {
      const t = (a / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius))
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x2a3648, transparent: true, opacity: 0.35 }),
    )
    this.scene.add(line)
  }

  /** liveliness pass: per-archetype ambient effects */
  private buildArchetypeEffects() {
    const recipe = this.body.renderRecipe
    const effects = recipe.effects ?? []
    const seed = seedFrom(this.body.id)

    if (recipe.archetype === 'ice') {
      const kyber = effects.includes('kyber-glint')
      const aurora = buildAuroras(
        1,
        kyber ? '#9fd0ff' : '#66ffc2',
        kyber ? '#c9a7ff' : '#66D9FF',
      )
      this.timedMats.push(...aurora.materials)
      this.planetGroup.add(aurora.object)
    }

    if (recipe.archetype === 'lava') {
      const count = effects.includes('ash-particles') ? 170 : 90
      const sparks = buildSparks(count, this.renderer.getPixelRatio())
      this.timedMats.push(...sparks.materials)
      this.planetGroup.add(sparks.object)
    }

    if (effects.includes('red-mist')) {
      const mist = buildMistShell(1.1, '#d0402e', seed)
      this.timedMats.push(...mist.materials)
      this.planetGroup.add(mist.object)
    }

    if (recipe.archetype === 'dark-storm') {
      const bolts = buildLightningColumns(8, 1)
      this.timedMats.push(...bolts.materials)
      this.planetGroup.add(bolts.object)
    }

    if (effects.includes('traffic')) {
      const count = this.body.id === 'coruscant' ? 14 : 10
      this.traffic = buildTraffic(count, 1.15)
      this.scene.add(this.traffic.group)
    }
  }

  protected update(simMs: number) {
    const simSec = simMs / 1000
    const dt = Math.min(this.wallSec - this.lastWall, 0.1)
    this.lastWall = this.wallSec

    // planet spin: one revolution per rotationHours of sim time
    this.planetGroup.rotation.y = ((simSec / 3600 / this.rotationHours) * Math.PI * 2) % (Math.PI * 2)

    for (const m of this.moonOrbiters) {
      const ang = m.phase + ((simSec / 86400) / m.periodDays) * Math.PI * 2
      m.obj.position.set(Math.cos(ang) * m.radius, 0, Math.sin(ang) * m.radius)
    }

    this.asteroidUpdate?.(dt)
    this.traffic?.update(this.wallSec, ORIGIN)

    // dive-in / depart camera animation along the current view direction
    if (this.introStart >= 0) {
      const t = (performance.now() - this.introStart) / INTRO_MS
      if (t >= 1) {
        this.introStart = -1
      } else {
        const d = THREE.MathUtils.lerp(CAM_FAR, CAM_NEAR, easeOutCubic(t))
        this.camera.position.normalize().multiplyScalar(d)
      }
    } else if (this.departStart >= 0) {
      const t = (performance.now() - this.departStart) / DEPART_MS
      const d = THREE.MathUtils.lerp(this.departFromDist, this.departFromDist * 2.6, easeInCubic(Math.min(t, 1)))
      this.camera.position.normalize().multiplyScalar(d)
    }

    if (this.poiCb && this.poiLocal.length && this.planetMesh) {
      const half = { w: this.canvas.clientWidth / 2, h: this.canvas.clientHeight / 2 }
      const camDir = new THREE.Vector3()
      this.camera.getWorldPosition(camDir)
      const out: PoiScreenPos[] = this.poiLocal.map(({ id, pos }) => {
        const world = pos.clone().applyMatrix4(this.planetMesh!.matrixWorld)
        const toCam = camDir.clone().sub(world).normalize()
        const normal = world.clone().normalize()
        const facing = normal.dot(toCam) > 0.12
        const proj = world.clone().project(this.camera)
        return {
          id,
          x: proj.x * half.w + half.w,
          y: -proj.y * half.h + half.h,
          visible: facing && proj.z < 1,
        }
      })
      this.poiCb(out)
    }
  }
}

const ORIGIN = new THREE.Vector3()
