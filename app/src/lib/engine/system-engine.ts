// SystemEngine: star-system overview — sun(s) at center, the planet on its
// orbit with moons, clickable to dive into the PlanetView.

import * as THREE from 'three'
import type { CelestialBody } from '../../types/lore'
import { EngineBase, type BaseCallbacks } from './engine-base'
import { ARCHETYPE_IDS, PLANET_FRAG, PLANET_VERT } from './planet-shaders'

export interface SystemCallbacks extends BaseCallbacks {
  onSelectBody?: (id: string) => void
  onLabelPositions?: (labels: { id: string; name: string; x: number; y: number; visible: boolean }[]) => void
}

interface OrbitingBody {
  id: string
  name: string
  mesh: THREE.Mesh
  orbitRadius: number
  periodDays: number
  phase: number
  parent?: OrbitingBody
}

function seedFrom(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return h / 100
}

export class SystemEngine extends EngineBase {
  private bodies: OrbitingBody[] = []
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private selectCb?: (id: string) => void
  private labelCb?: SystemCallbacks['onLabelPositions']
  private sunAnchors: { mesh: THREE.Object3D; radius: number; phase: number }[] = []
  private clickable: THREE.Mesh[] = []

  constructor(canvas: HTMLCanvasElement, cb: SystemCallbacks) {
    super(canvas, cb)
    this.selectCb = cb.onSelectBody
    this.labelCb = cb.onLabelPositions
  }

  init(primary: CelestialBody, lang: 'en' | 'tr') {
    this.initGL(new THREE.Vector3(0, 14, 26), 0.7)
    this.controls.minDistance = 6
    this.controls.maxDistance = 90
    this.addStarfield(1400)
    this.buildSuns(primary)
    this.buildPlanet(primary, lang)
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.start()
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

  private buildPlanet(body: CelestialBody, lang: 'en' | 'tr') {
    const orbitRadius = 16
    const recipe = body.renderRecipe
    const mat = new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
      uniforms: {
        uArchetype: { value: ARCHETYPE_IDS[recipe.archetype] ?? 10 },
        uSeed: { value: seedFrom(body.id) },
        uTime: { value: 0 },
        uPrimary: { value: new THREE.Color(recipe.palette.primary) },
        uSecondary: { value: new THREE.Color(recipe.palette.secondary ?? recipe.palette.primary) },
        uAtmoColor: { value: new THREE.Color(recipe.atmosphere?.color ?? '#88aaff') },
        uSun1Dir: { value: new THREE.Vector3(1, 0, 0) },
        uSun1Color: { value: new THREE.Color(body.suns?.[0]?.color ?? '#FFEFD0') },
        uSun2Dir: { value: new THREE.Vector3(1, 0, 0) },
        uSun2Color: { value: new THREE.Color(body.suns?.[1]?.color ?? '#FFEFD0') },
        uHasSun2: { value: (body.suns?.length ?? 0) > 1 ? 1 : 0 },
        uAlbedo: { value: null },
        uUseAlbedo: { value: 0 },
        uNight: { value: null },
        uUseNight: { value: 0 },
      },
    })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 64, 64), mat)
    mesh.userData.bodyId = body.id
    this.scene.add(mesh)
    this.clickable.push(mesh)
    this.addOrbitLine(orbitRadius, 0x2a3648, 0.5)

    const planet: OrbitingBody = {
      id: body.id,
      name: body.names[lang],
      mesh,
      orbitRadius,
      periodDays: 300,
      phase: seedFrom(body.id),
    }
    this.bodies.push(planet)

    const moonNames = body.moons ?? []
    const moonCount = Math.min(moonNames.length || (body.stats?.moonCount ?? 0), 4)
    for (let i = 0; i < moonCount; i++) {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.16 + (i % 2) * 0.05, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0x9a938c }),
      )
      this.scene.add(moon)
      this.bodies.push({
        id: `${body.id}-moon-${i}`,
        name: moonNames[i] ?? '',
        mesh: moon,
        orbitRadius: 2.2 + i * 0.8,
        periodDays: 5 + i * 8,
        phase: (i / Math.max(moonCount, 1)) * Math.PI * 2,
        parent: planet,
      })
    }
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
    const hit = this.raycaster.intersectObjects(this.clickable, false)
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
    const hit = this.raycaster.intersectObjects(this.clickable, false)
    const id = hit[0]?.object.userData.bodyId as string | undefined
    if (id) this.selectCb?.(id)
  }

  protected update(simMs: number) {
    const simSec = simMs / 1000
    const simDays = simSec / 86400

    for (const sun of this.sunAnchors) {
      if (sun.radius > 0) {
        const ang = sun.phase + (simDays / 40) * Math.PI * 2
        sun.mesh.position.set(Math.cos(ang) * sun.radius, 0, Math.sin(ang) * sun.radius)
      }
    }

    for (const b of this.bodies) {
      const ang = b.phase + (simDays / b.periodDays) * Math.PI * 2
      const center = b.parent ? b.parent.mesh.position : new THREE.Vector3()
      b.mesh.position.set(
        center.x + Math.cos(ang) * b.orbitRadius,
        0,
        center.z + Math.sin(ang) * b.orbitRadius,
      )
      const mat = b.mesh.material as THREE.ShaderMaterial
      if (mat.uniforms?.uSun1Dir) {
        mat.uniforms.uTime.value = simSec % 100000
        const dir = b.mesh.position.clone().negate().normalize()
        ;(mat.uniforms.uSun1Dir.value as THREE.Vector3).copy(dir)
        if (this.sunAnchors[1]) {
          const dir2 = this.sunAnchors[1].mesh.position.clone().sub(b.mesh.position).normalize()
          ;(mat.uniforms.uSun2Dir.value as THREE.Vector3).copy(dir2)
        }
      }
      b.mesh.rotation.y = simSec / 5000
    }

    if (this.labelCb) {
      const half = { w: this.canvas.clientWidth / 2, h: this.canvas.clientHeight / 2 }
      this.labelCb(
        this.bodies
          .filter((b) => !b.parent && b.name)
          .map((b) => {
            const proj = b.mesh.position.clone().project(this.camera)
            return {
              id: b.id,
              name: b.name,
              x: proj.x * half.w + half.w,
              y: -proj.y * half.h + half.h - 26,
              visible: proj.z < 1,
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
