// SystemEngine: star-system overview — sun(s) at center, the planet on its
// orbit with real-recipe moons, era-gated Death Stars, ambient ship traffic
// and a soft camera follow. Everything with a name is clickable.

import * as THREE from 'three'
import type { CelestialBody, EraId } from '../../types/lore'
import { rendersAsRubble, stationsForHost } from '../lore'
import { EngineBase, type BaseCallbacks } from './engine-base'
import { buildAsteroidField, buildStationBody, buildTraffic, type TrafficSystem } from './effects'
import { makeBodyMaterial, seedFrom, type SunLight } from './body-material'

export interface SystemCallbacks extends BaseCallbacks {
  onSelectBody?: (id: string) => void
  onLabelPositions?: (labels: { id: string; name: string; x: number; y: number; visible: boolean; minor?: boolean }[]) => void
}

interface OrbitingBody {
  id: string
  name: string
  anchor: THREE.Object3D
  spin?: THREE.Object3D
  orbitRadius: number
  periodDays: number
  phase: number
  parent?: OrbitingBody
  minor?: boolean
  /** world-space radius of the drawn body — sets the fly-to arrival distance */
  bodyRadius: number
}

const TRAFFIC_BY_ARCHETYPE: Record<string, number> = {
  ecumenopolis: 14,
  verdant: 5,
  desert: 3,
  barren: 2,
  'gas-giant': 6,
}

export class SystemEngine extends EngineBase {
  private bodies: OrbitingBody[] = []
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private selectCb?: (id: string) => void
  private labelCb?: SystemCallbacks['onLabelPositions']
  private sunAnchors: { mesh: THREE.Object3D; radius: number; phase: number }[] = []
  private clickable: THREE.Object3D[] = []
  private asteroidUpdate?: (dt: number) => void
  private traffic?: TrafficSystem
  private planetBody?: OrbitingBody
  private lastWall = 0
  private lastTarget = new THREE.Vector3()
  private followInitialized = false

  constructor(canvas: HTMLCanvasElement, cb: SystemCallbacks) {
    super(canvas, cb)
    this.selectCb = cb.onSelectBody
    this.labelCb = cb.onLabelPositions
  }

  init(primary: CelestialBody, era: EraId, lang: 'en' | 'tr') {
    this.initGL(new THREE.Vector3(0, 14, 26), 0.7)
    this.controls.minDistance = 6
    this.controls.maxDistance = 90
    this.addStarfield(1400)
    this.buildSuns(primary)
    this.buildPlanet(primary, era, lang)
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.start()
  }

  /** Close on one orbiting body; the planet view picks the camera up from the
   *  same framing so the approach reads as one continuous move. */
  flyToBody(id: string): number {
    const body = this.bodies.find((b) => b.id === id)
    if (!body) return 0
    return this.flyTo(() => body.anchor.position, body.bodyRadius * 5.4, 1250)
  }

  private buildSuns(primary: CelestialBody) {
    const suns = primary.suns?.length ? primary.suns : [{ name: 'Sun', color: '#FFEFD0' }]
    const twin = suns.length > 1
    suns.slice(0, 2).forEach((sun, i) => {
      const group = new THREE.Group()
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(twin ? 1.15 - i * 0.25 : 1.5, 48, 48),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(sun.color) }),
      )
      group.add(core)
      const glow = this.makeSunSprite(sun.color, twin ? 9 - i * 2.5 : 11)
      group.add(glow)
      this.scene.add(group)
      this.sunAnchors.push({
        mesh: group,
        radius: twin ? 1.6 : 0,
        phase: i * Math.PI,
      })
    })
  }

  /** the per-frame loop rewrites uSun*Dir from the live star positions, so the
   *  factory's placeholder directions only matter for the very first frame */
  private bodyMaterial(body: CelestialBody, era: EraId, suns: CelestialBody['suns']): THREE.ShaderMaterial {
    const lights: SunLight[] = (suns?.length ? suns : [{ name: 'Sun', color: '#FFEFD0' }])
      .slice(0, 2)
      .map((sun) => ({ dir: new THREE.Vector3(1, 0, 0), color: new THREE.Color(sun.color) }))
    const mat = makeBodyMaterial(body, era, lights)
    this.timedMats.push(mat)
    this.loadSurfaceTextures(body.id, mat)
    return mat
  }

  private buildPlanet(body: CelestialBody, era: EraId, lang: 'en' | 'tr') {
    const orbitRadius = 16
    const anchor = new THREE.Group()
    this.scene.add(anchor)
    this.addOrbitLine(orbitRadius, 0x2a3648, 0.5)

    const planet: OrbitingBody = {
      id: body.id,
      name: body.names[lang],
      anchor,
      orbitRadius,
      periodDays: 300,
      phase: seedFrom(body.id),
      bodyRadius: 1.1,
    }
    this.bodies.push(planet)
    this.planetBody = planet

    if (rendersAsRubble(body, era)) {
      // the graveyard: a slow asteroid disk where the world used to hang
      const s1Color = new THREE.Color(body.suns?.[0]?.color ?? '#FFEFD0')
      const field = buildAsteroidField(240, 0.5, 1.9, new THREE.Vector3(1, 0.2, 0), s1Color)
      anchor.add(field.object)
      this.asteroidUpdate = field.update
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 12, 12),
        new THREE.MeshBasicMaterial({ visible: false }),
      )
      hit.userData.bodyId = body.id
      anchor.add(hit)
      this.clickable.push(hit)
      return
    }

    const spin = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 64, 64),
      this.bodyMaterial(body, era, body.suns),
    )
    spin.userData.bodyId = body.id
    anchor.add(spin)
    planet.spin = spin
    this.clickable.push(spin)

    // detailed moons orbit the planet with their true recipes, clickable
    const detail = body.moonsDetail ?? []
    const plainCount = detail.length
      ? 0
      : Math.min((body.moons ?? []).length || (body.stats?.moonCount ?? 0), 4)
    detail.slice(0, 4).forEach((moon, i) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 40, 40),
        this.bodyMaterial(moon, era, body.suns),
      )
      mesh.userData.bodyId = moon.id
      this.scene.add(mesh)
      this.clickable.push(mesh)
      this.bodies.push({
        id: moon.id,
        name: moon.names[lang],
        anchor: mesh,
        spin: mesh,
        orbitRadius: 2.4 + i * 1.0,
        periodDays: 5 + i * 8,
        phase: (i / Math.max(detail.length, 1)) * Math.PI * 2,
        parent: planet,
        minor: true,
        bodyRadius: 0.34,
      })
    })
    for (let i = 0; i < plainCount; i++) {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.16 + (i % 2) * 0.05, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0x9a938c }),
      )
      this.scene.add(moon)
      this.bodies.push({
        id: `${body.id}-moon-${i}`,
        name: (body.moons ?? [])[i] ?? '',
        anchor: moon,
        orbitRadius: 2.2 + i * 0.8,
        periodDays: 5 + i * 8,
        phase: (i / Math.max(plainCount, 1)) * Math.PI * 2,
        parent: planet,
        minor: true,
        bodyRadius: 0.16 + (i % 2) * 0.05,
      })
    }

    // era-gated stations (Death Stars), clickable like moons
    stationsForHost(body.id, era).forEach((station, i) => {
      const ds = buildStationBody(station, 0.42, seedFrom(station.id))
      this.timedMats.push(...ds.materials)
      ds.object.traverse((o) => {
        o.userData.bodyId = station.id
      })
      this.scene.add(ds.object)
      this.clickable.push(ds.object)
      this.bodies.push({
        id: station.id,
        name: station.names[lang],
        anchor: ds.object,
        orbitRadius: 4.4 + i * 1.2,
        periodDays: 14 + i * 6,
        phase: 2.2 + i,
        parent: planet,
        minor: true,
        bodyRadius: 0.42,
      })
    })

    // ambient traffic scaled to how busy the world is
    const density = TRAFFIC_BY_ARCHETYPE[body.renderRecipe.archetype] ?? 6
    this.traffic = buildTraffic(density, 1.5)
    this.scene.add(this.traffic.group)
  }

  private addOrbitLine(radius: number, color: number, opacity: number) {
    const pts: THREE.Vector3[] = []
    for (let a = 0; a <= 256; a++) {
      const t = (a / 256) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius))
    }
    this.scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
      ),
    )
  }

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.intersectObjects(this.clickable, true)
    this.canvas.style.cursor = hit.length ? 'pointer' : 'grab'
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.intersectObjects(this.clickable, true)
    const id = hit[0]?.object.userData.bodyId as string | undefined
    if (id) this.selectCb?.(id)
  }

  protected update(simMs: number) {
    const simSec = simMs / 1000
    const simDays = simSec / 86400
    const dt = Math.min(this.wallSec - this.lastWall, 0.1)
    this.lastWall = this.wallSec

    for (const sun of this.sunAnchors) {
      if (sun.radius > 0) {
        const ang = sun.phase + (simDays / 40) * Math.PI * 2
        sun.mesh.position.set(Math.cos(ang) * sun.radius, 0, Math.sin(ang) * sun.radius)
      }
    }

    for (const b of this.bodies) {
      const ang = b.phase + (simDays / b.periodDays) * Math.PI * 2
      const center = b.parent ? b.parent.anchor.position : ZERO
      b.anchor.position.set(
        center.x + Math.cos(ang) * b.orbitRadius,
        0,
        center.z + Math.sin(ang) * b.orbitRadius,
      )
      const spinObj = b.spin ?? b.anchor
      const mesh = spinObj as THREE.Mesh
      const mat = mesh.material as THREE.ShaderMaterial | undefined
      // station materials carry uSun1Dir only — uSun2Dir is planet-shader specific
      if (mat?.uniforms?.uSun1Dir) {
        const dir = this.sunAnchors[0].mesh.position.clone().sub(b.anchor.position).normalize()
        ;(mat.uniforms.uSun1Dir.value as THREE.Vector3).copy(dir)
        if (this.sunAnchors[1] && mat.uniforms.uSun2Dir) {
          const dir2 = this.sunAnchors[1].mesh.position.clone().sub(b.anchor.position).normalize()
          ;(mat.uniforms.uSun2Dir.value as THREE.Vector3).copy(dir2)
        }
      }
      spinObj.rotation.y = simSec / 5000
    }

    this.asteroidUpdate?.(dt)

    // soft camera follow: keep the orbiting planet framed without fighting input
    if (this.planetBody) {
      const target = this.planetBody.anchor.position
      if (!this.followInitialized) {
        this.followInitialized = true
        this.lastTarget.copy(target)
        this.controls.target.copy(target)
      } else if (this.flying) {
        // the flight owns the camera; only keep the reference in sync so the
        // follow does not jump by the whole flight's worth of orbit afterwards
        this.lastTarget.copy(target)
      } else {
        const delta = target.clone().sub(this.lastTarget)
        this.camera.position.add(delta)
        this.controls.target.add(delta)
        this.lastTarget.copy(target)
      }
    }
    if (this.planetBody) this.traffic?.update(this.wallSec, this.planetBody.anchor.position)

    if (this.labelCb) {
      const half = { w: this.canvas.clientWidth / 2, h: this.canvas.clientHeight / 2 }
      this.labelCb(
        this.bodies
          .filter((b) => b.name)
          .map((b) => {
            const proj = b.anchor.position.clone().project(this.camera)
            return {
              id: b.id,
              name: b.name,
              x: proj.x * half.w + half.w,
              y: -proj.y * half.h + half.h - 26,
              visible: proj.z < 1,
              minor: b.minor,
            }
          }),
      )
    }
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    super.dispose()
  }
}

const ZERO = new THREE.Vector3()
