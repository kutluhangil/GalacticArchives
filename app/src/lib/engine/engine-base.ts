// Shared imperative three.js scaffolding for the planet/system views:
// renderer + bloom composer + starfield + RAF loop + resize + disposal.
// Same architectural pattern as the original globe-engine.ts.

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { qualitySettings } from '../quality'
import { STAR_FRAG, STAR_VERT } from './planet-shaders'

export interface BaseCallbacks {
  /** simulated ms epoch — drives rotations and orbits */
  getSimTime: () => number
  onFps?: (fps: number) => void
}

export abstract class EngineBase {
  protected renderer!: THREE.WebGLRenderer
  protected composer!: EffectComposer
  protected scene = new THREE.Scene()
  protected camera!: THREE.PerspectiveCamera
  protected controls!: OrbitControls
  protected canvas: HTMLCanvasElement
  protected cb: BaseCallbacks
  /** wall-clock seconds since start — drives effect shaders at constant rate
   *  regardless of sim-time speed (no strobing at 1h/s) */
  protected wallSec = 0
  /** materials whose uTime uniform should tick with wallSec */
  protected timedMats: THREE.ShaderMaterial[] = []
  protected reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  protected quality = qualitySettings()
  private flight?: {
    getTarget: () => THREE.Vector3
    from: THREE.Vector3
    fromTarget: THREE.Vector3
    endDist: number
    start: number
    ms: number
  }
  private raf = 0
  private disposed = false
  private startWall = 0
  private fpsCount = 0
  private fpsLast = 0
  private resizeObs?: ResizeObserver

  constructor(canvas: HTMLCanvasElement, cb: BaseCallbacks) {
    this.canvas = canvas
    this.cb = cb
  }

  protected initGL(camPos: THREE.Vector3, bloomStrength: number) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.quality = qualitySettings()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality.maxPixelRatio))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 4000)
    this.camera.position.copy(camPos)

    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enablePan = false

    const size = new THREE.Vector2()
    this.renderer.getSize(size)
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    if (this.quality.bloom) {
      // tight radius: a wide bloom smears city lights into a visible
      // rectangular halo from the pass's own downsample chain
      this.composer.addPass(new UnrealBloomPass(size, bloomStrength, 0.32, 0.85))
    }
    this.composer.addPass(new OutputPass())

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(this.canvas.parentElement ?? this.canvas)
    this.resize()
  }

  protected addStarfield(radius: number) {
    const N = this.quality.starCount
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const phase = new Float32Array(N)
    const c = new THREE.Color()
    for (let i = 0; i < N; i++) {
      // 25% of stars biased toward a galactic band for depth
      const banded = i % 4 === 0
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const y = banded ? u * 0.18 : u
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const p = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta))
      if (banded) p.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5)
      p.multiplyScalar(radius * (0.9 + Math.random() * 0.1))
      pos.set([p.x, p.y, p.z], i * 3)
      // real skies are mostly faint stars with a handful of bright ones; a flat
      // random spread is what makes a starfield read as scattered confetti
      const rank = Math.pow(Math.random(), 2.6)
      const hue = Math.random()
      c.setHSL(
        hue > 0.93 ? 0.06 : hue > 0.84 ? 0.11 : 0.58 + Math.random() * 0.07,
        hue > 0.84 ? 0.55 : 0.28,
        0.55 + rank * 0.4,
      )
      c.multiplyScalar(0.35 + rank * 0.65)
      col.set([c.r, c.g, c.b], i * 3)
      size[i] = 0.5 + rank * 2.3
      // ~1 in 3 stars twinkles; the rest hold steady (phase 0 -> constant term)
      phase[i] = Math.random() < 0.34 ? Math.random() : 0
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
    })
    const stars = new THREE.Points(geo, mat)
    stars.frustumCulled = false
    this.scene.add(stars)
    this.timedMats.push(mat)
  }

  /** Camera approach: ease from wherever the viewer is to `endDist` away from
   *  a (possibly moving) target. Returns the flight duration in ms — 0 when
   *  reduced motion is on, so the caller navigates immediately instead.
   *  Orbit input is suspended for the duration. */
  flyTo(getTarget: () => THREE.Vector3, endDist: number, ms = 1250): number {
    if (this.reducedMotion) return 0
    this.flight = {
      getTarget,
      from: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      endDist,
      start: performance.now(),
      ms,
    }
    this.controls.enabled = false
    return ms
  }

  protected get flying(): boolean {
    return this.flight !== undefined
  }

  /** Runs after update() so a subclass's own camera work (system follow) does
   *  not fight the flight for the same frame. */
  private tickFlight() {
    const f = this.flight
    if (!f) return
    const target = f.getTarget()
    const k = Math.min((performance.now() - f.start) / f.ms, 1)
    // ease-in-out: leaves the overview gently, settles without overshoot
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
    const dir = f.from.clone().sub(target)
    if (dir.lengthSq() < 1e-8) dir.set(0, 0.4, 1)
    const arrival = target.clone().add(dir.normalize().multiplyScalar(f.endDist))
    this.camera.position.lerpVectors(f.from, arrival, e)
    this.controls.target.lerpVectors(f.fromTarget, target, e)
    this.camera.lookAt(this.controls.target)
    if (k >= 1) this.flight = undefined
  }

  /** Soft additive sun glow sprite (canvas radial gradient). */
  protected makeSunSprite(color: string, scale: number): THREE.Sprite {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 128
    const ctx = cv.getContext('2d')!
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.18, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.SpriteMaterial({
      map: tex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.setScalar(scale)
    return sprite
  }

  start() {
    this.fpsLast = performance.now()
    this.startWall = performance.now()
    const loop = () => {
      if (this.disposed) return
      this.raf = requestAnimationFrame(loop)
      this.wallSec = (performance.now() - this.startWall) / 1000
      for (const mat of this.timedMats) mat.uniforms.uTime.value = this.wallSec
      this.controls.update()
      this.update(this.cb.getSimTime())
      this.tickFlight()
      this.composer.render()
      this.fpsCount++
      const now = performance.now()
      if (now - this.fpsLast >= 1000) {
        this.cb.onFps?.((this.fpsCount * 1000) / (now - this.fpsLast))
        this.fpsCount = 0
        this.fpsLast = now
      }
    }
    loop()
  }

  protected abstract update(simMs: number): void

  private resize() {
    const el = this.canvas.parentElement ?? this.canvas
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.composer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.resizeObs?.disconnect()
    this.controls.dispose()
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat?.dispose()
    })
    this.composer.dispose()
    this.renderer.dispose()
  }
}
