// GalaxyEngine: oblique 3D galaxy disk — procedural spiral starfield, region
// bands, era-colored system nodes on the canon Galactic Atlas letter-number
// grid. Clicking a node hyperjumps to its star system.

import * as THREE from 'three'
import type { RegionId } from '../../types/lore'
import { EngineBase, type BaseCallbacks } from './engine-base'
import { makeGlowTexture } from './effects'
import { STAR_FRAG, STAR_VERT } from './planet-shaders'

export const GALAXY_R = 20

export interface GalaxyNode {
  id: string
  name: string
  /** disk-plane position in world units (see gridToPos) */
  x: number
  z: number
  color: string
  destroyed: boolean
}

export interface GalaxyCallbacks extends BaseCallbacks {
  onSelect?: (id: string) => void
  onLabelPositions?: (labels: { id: string; name: string; x: number; y: number; visible: boolean; destroyed: boolean }[]) => void
  onRegionHover?: (region: RegionId | null) => void
}

/** Canon grid "R-16" -> disk position. Letters A..V span west->east,
 *  numbers 1..21 north->south. Radius clamped inside the disk. */
export function gridToPos(grid: string): { x: number; z: number } {
  const [letter, num] = grid.split('-')
  const ci = letter.charCodeAt(0) - 65 // A=0 .. V=21
  const ni = parseInt(num, 10)
  let x = ((ci + 0.5) / 22) * 2 - 1
  let z = ((ni - 0.5) / 21) * 2 - 1
  const r = Math.hypot(x, z)
  if (r > 0.95) {
    x = (x / r) * 0.95
    z = (z / r) * 0.95
  }
  return { x: x * GALAXY_R, z: z * GALAXY_R }
}

/** worlds without verified coordinates get hand-placed canon-plausible spots */
export const MANUAL_POS: Record<string, { x: number; z: number }> = {
  kamino: { x: 0.78 * GALAXY_R, z: 0.58 * GALAXY_R }, // south-east Wild Space rim
  shakari: { x: -0.12 * GALAXY_R, z: 0.84 * GALAXY_R }, // southern Outer Rim
  peridea: { x: -0.95 * GALAXY_R, z: -0.85 * GALAXY_R }, // separate far-galaxy islet
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

/** System node marker: bright core + faction-colored targeting ring, so nodes
 *  stay legible against the spiral's own starfield. Cached per color. */
const nodeTexCache = new Map<string, THREE.CanvasTexture>()
function makeNodeTexture(color: string): THREE.CanvasTexture {
  const hit = nodeTexCache.get(color)
  if (hit) return hit
  const cv = document.createElement('canvas')
  cv.width = cv.height = 64
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 16)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.35, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.arc(32, 32, 21, 0, Math.PI * 2)
  ctx.stroke()
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  nodeTexCache.set(color, tex)
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
  private hitTargets: THREE.Mesh[] = []
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private selectCb?: (id: string) => void
  private labelCb?: GalaxyCallbacks['onLabelPositions']
  private regionCb?: GalaxyCallbacks['onRegionHover']
  private lastRegion: RegionId | null = null
  private brokenTex = makeBrokenRingTexture()
  private spiral?: THREE.Points
  private comet?: THREE.Sprite
  private cometStart = 6
  private cometFrom = new THREE.Vector3()
  private cometTo = new THREE.Vector3()

  constructor(canvas: HTMLCanvasElement, cb: GalaxyCallbacks) {
    super(canvas, cb)
    this.selectCb = cb.onSelect
    this.labelCb = cb.onLabelPositions
    this.regionCb = cb.onRegionHover
  }

  init(nodes: GalaxyNode[]) {
    this.nodes = nodes
    this.initGL(new THREE.Vector3(0, 26, 31), 0.75)
    this.controls.minDistance = 8
    this.controls.maxDistance = 62
    this.controls.maxPolarAngle = 1.32
    this.controls.target.set(0, 0, 1.5)
    this.addStarfield(1600)
    this.buildDisk()
    this.buildRegionRings()
    this.buildNodes()
    this.buildComet()
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.start()
  }

  /** re-tint nodes when the era changes (no rebuild) */
  applyNodeStates(states: { id: string; color: string; destroyed: boolean }[]) {
    for (const s of states) {
      const sprite = this.nodeSprites.get(s.id)
      const node = this.nodes.find((n) => n.id === s.id)
      if (!sprite || !node) continue
      node.color = s.color
      node.destroyed = s.destroyed
      const mat = sprite.material as THREE.SpriteMaterial
      mat.map = s.destroyed ? this.brokenTex : makeNodeTexture(s.color)
      mat.blending = s.destroyed ? THREE.NormalBlending : THREE.AdditiveBlending
      mat.needsUpdate = true
    }
  }

  private buildDisk() {
    // spiral arm starfield
    const N = 9500
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const phase = new Float32Array(N)
    const c = new THREE.Color()
    const inner = new THREE.Color('#ffdfae')
    const mid = new THREE.Color('#cdd8ff')
    const outer = new THREE.Color('#8fb0ff')
    for (let i = 0; i < N; i++) {
      const arm = i % 4
      const t = Math.pow(Math.random(), 0.62)
      const spread = 0.38 * (1 - t * 0.5)
      const theta =
        arm * (Math.PI / 2) +
        t * 5.4 +
        (Math.random() - 0.5) * spread * 4 +
        Math.random() * 0.12
      const r = t * GALAXY_R * 0.97
      const y = (Math.random() - 0.5) * (1 - t) * GALAXY_R * 0.045
      pos.set([Math.cos(theta) * r, y, Math.sin(theta) * r], i * 3)
      c.copy(inner).lerp(mid, Math.min(t * 1.8, 1)).lerp(outer, Math.max(0, t - 0.45) * 1.8)
      c.multiplyScalar(0.75 + Math.random() * 0.45)
      col.set([c.r, c.g, c.b], i * 3)
      size[i] = 0.5 + Math.random() * 1.9
      phase[i] = Math.random() < 0.22 ? Math.random() : 0
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uPixelRatio: { value: this.renderer.getPixelRatio() }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.timedMats.push(mat)
    this.spiral = new THREE.Points(geo, mat)
    this.spiral.frustumCulled = false
    this.scene.add(this.spiral)

    // dust lanes: dark points hugging the arms, drawn over the glow
    const D = 1700
    const dpos = new Float32Array(D * 3)
    for (let i = 0; i < D; i++) {
      const arm = i % 4
      const t = 0.15 + Math.pow(Math.random(), 0.8) * 0.8
      const theta = arm * (Math.PI / 2) + t * 5.4 + 0.18 + (Math.random() - 0.5) * 0.5
      const r = t * GALAXY_R * 0.95
      dpos.set([Math.cos(theta) * r, 0.06, Math.sin(theta) * r], i * 3)
    }
    const dgeo = new THREE.BufferGeometry()
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3))
    const dmat = new THREE.PointsMaterial({
      color: new THREE.Color('#05070d'),
      size: 0.85,
      sizeAttenuation: true,
      map: makeGlowTexture('#ffffff'), // radial alpha: soft round motes, not squares
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
    const dust = new THREE.Points(dgeo, dmat)
    dust.frustumCulled = false
    this.scene.add(dust)

    // galactic core glow
    const core = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('#ffd9a0'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.95,
      }),
    )
    core.scale.setScalar(GALAXY_R * 0.42)
    ;(core.material as THREE.SpriteMaterial).opacity = 0.6
    this.scene.add(core)
    const coreInner = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('#ffffff'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    )
    coreInner.scale.setScalar(GALAXY_R * 0.16)
    this.scene.add(coreInner)

    // Peridea islet: a small far-galaxy blob in the top-left corner
    const islet = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('#b49ac8'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      }),
    )
    islet.scale.setScalar(GALAXY_R * 0.22)
    islet.position.set(MANUAL_POS.peridea.x, -0.2, MANUAL_POS.peridea.z)
    this.scene.add(islet)

    // Kessel Maelstrom haze (T-10 neighborhood)
    const maelstrom = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('#5a6f8a'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.4,
      }),
    )
    const kesselPos = gridToPos('T-10')
    maelstrom.scale.setScalar(GALAXY_R * 0.17)
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
          map: node.destroyed ? this.brokenTex : makeNodeTexture(node.color),
          blending: node.destroyed ? THREE.NormalBlending : THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        }),
      )
      sprite.scale.setScalar(1.15)
      sprite.position.set(node.x, 0.12, node.z)
      this.scene.add(sprite)
      this.nodeSprites.set(node.id, sprite)

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

  private onPointerMove = (e: PointerEvent) => {
    this.setPointer(e)
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)
    this.canvas.style.cursor = hit.length ? 'pointer' : 'grab'
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
    if (id) this.selectCb?.(id)
  }

  protected update() {
    // near-imperceptible background rotation keeps the disk alive
    if (this.spiral) this.spiral.rotation.y = this.wallSec * 0.004

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
            visible: proj.z < 1 && camDist < 56,
            destroyed: n.destroyed,
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
