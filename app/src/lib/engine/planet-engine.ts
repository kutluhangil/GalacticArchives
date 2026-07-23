// PlanetEngine: the close-up "globe" view — one celestial body with archetype
// shader surface, atmosphere, clouds, rings, orbiting moons and its sun(s).
// Rotation is driven by simulated time (real-time terminator drift).

import * as THREE from 'three'
import type { CelestialBody } from '../../types/lore'
import { EngineBase, type BaseCallbacks } from './engine-base'
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

const CLOUD_DENSITY: Record<string, number> = { temperate: 0.45, storm: 0.62, sickly: 0.3 }
const CLOUD_TINT: Record<string, string> = {
  temperate: '#ffffff',
  storm: '#e8ecf2',
  sickly: '#cfd0a0',
}

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

export class PlanetEngine extends EngineBase {
  private body!: CelestialBody
  private planetGroup = new THREE.Group()
  private planetMesh!: THREE.Mesh
  private planetMat!: THREE.ShaderMaterial
  private cloudMat?: THREE.ShaderMaterial
  private moonMeshes: { mesh: THREE.Mesh; radius: number; periodDays: number; phase: number }[] = []
  private sunDirs: { dir: THREE.Vector3; color: THREE.Color }[] = []
  private poiLocal: { id: string; pos: THREE.Vector3 }[] = []
  private poiCb?: (p: PoiScreenPos[]) => void
  private rotationHours = 24

  constructor(canvas: HTMLCanvasElement, cb: PlanetCallbacks) {
    super(canvas, cb)
    this.poiCb = cb.onPoiPositions
  }

  init(body: CelestialBody) {
    this.body = body
    this.initGL(new THREE.Vector3(0, 0.55, 3.1), 0.55)
    this.controls.minDistance = 1.5
    this.controls.maxDistance = 14
    this.addStarfield(900)
    this.buildSuns()
    this.buildPlanet()
    this.buildMoons()
    this.start()
  }

  private buildSuns() {
    const suns = this.body.suns?.length
      ? this.body.suns
      : [{ name: 'Sun', color: '#FFEFD0' }]
    // primary sun off to the right; twin suns sit a few degrees apart (ESB shot)
    suns.slice(0, 2).forEach((sun, i) => {
      const angle = 0.45 + i * 0.09
      const dir = new THREE.Vector3(Math.cos(angle), 0.22 + i * 0.05, -Math.sin(angle)).normalize()
      this.sunDirs.push({ dir, color: new THREE.Color(sun.color) })
      const sprite = this.makeSunSprite(sun.color, 26 - i * 8)
      sprite.position.copy(dir.clone().multiplyScalar(240))
      this.scene.add(sprite)
    })
  }

  private buildPlanet() {
    const recipe = this.body.renderRecipe
    const seed = seedFrom(this.body.id)
    this.rotationHours = this.body.stats?.diameterKm ? 20 + (seedFrom(this.body.id) % 12) : 24

    const geo = new THREE.SphereGeometry(1, 128, 128)
    const [s1, s2] = [this.sunDirs[0], this.sunDirs[1] ?? this.sunDirs[0]]
    this.planetMat = new THREE.ShaderMaterial({
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
        uAlbedo: { value: null },
        uUseAlbedo: { value: 0 },
        uNight: { value: null },
        uUseNight: { value: 0 },
      },
    })
    this.planetMesh = new THREE.Mesh(geo, this.planetMat)
    this.planetGroup.add(this.planetMesh)
    this.scene.add(this.planetGroup)

    // atmosphere shell
    if (recipe.atmosphere) {
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(1.045, 64, 64),
        new THREE.ShaderMaterial({
          vertexShader: ATMO_VERT,
          fragmentShader: ATMO_FRAG,
          uniforms: {
            uColor: { value: new THREE.Color(recipe.atmosphere.color) },
            uDensity: { value: recipe.atmosphere.density },
          },
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        }),
      )
      this.planetGroup.add(atmo)
    }

    // cloud layer
    const cloudsKind = recipe.textures?.clouds
    if (cloudsKind) {
      this.cloudMat = new THREE.ShaderMaterial({
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: seed + 3.7 },
          uDensity: { value: CLOUD_DENSITY[cloudsKind] ?? 0.45 },
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
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.014, 96, 96), this.cloudMat)
      this.planetGroup.add(clouds)
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

  private buildMoons() {
    const names = this.body.moons ?? []
    const count = Math.min(names.length || (this.body.stats?.moonCount ?? 0), 4)
    for (let i = 0; i < count; i++) {
      const size = 0.045 + (i % 3) * 0.02
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#9a938c') })
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 24), mat)
      this.scene.add(mesh)
      this.moonMeshes.push({
        mesh,
        radius: 2.1 + i * 0.75,
        periodDays: 4 + i * 6,
        phase: (i * Math.PI * 2) / Math.max(count, 1) + seedFrom(this.body.id),
      })
      // faint orbit line
      const pts: THREE.Vector3[] = []
      for (let a = 0; a <= 128; a++) {
        const t = (a / 128) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(t) * (2.1 + i * 0.75), 0, Math.sin(t) * (2.1 + i * 0.75)))
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x2a3648, transparent: true, opacity: 0.35 }),
      )
      this.scene.add(line)
    }
  }

  protected update(simMs: number) {
    const simSec = simMs / 1000
    // planet spin: one revolution per rotationHours of sim time
    this.planetGroup.rotation.y = ((simSec / 3600 / this.rotationHours) * Math.PI * 2) % (Math.PI * 2)
    this.planetMat.uniforms.uTime.value = simSec % 100000
    if (this.cloudMat) this.cloudMat.uniforms.uTime.value = simSec % 100000

    for (const m of this.moonMeshes) {
      const ang = m.phase + ((simSec / 86400) / m.periodDays) * Math.PI * 2
      m.mesh.position.set(Math.cos(ang) * m.radius, 0, Math.sin(ang) * m.radius)
    }

    if (this.poiCb && this.poiLocal.length) {
      const half = { w: this.canvas.clientWidth / 2, h: this.canvas.clientHeight / 2 }
      const camDir = new THREE.Vector3()
      this.camera.getWorldPosition(camDir)
      const out: PoiScreenPos[] = this.poiLocal.map(({ id, pos }) => {
        const world = pos.clone().applyMatrix4(this.planetMesh.matrixWorld)
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
