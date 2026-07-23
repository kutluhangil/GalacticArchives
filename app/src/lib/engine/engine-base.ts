// Shared imperative three.js scaffolding for the planet/system views:
// renderer + bloom composer + starfield + RAF loop + resize + disposal.
// Same architectural pattern as the original globe-engine.ts.

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    // tight radius: a wide bloom smears city lights into a visible rectangular
    // halo from the pass's own downsample chain
    const bloom = new UnrealBloomPass(size, bloomStrength, 0.32, 0.85)
    this.composer.addPass(bloom)
    this.composer.addPass(new OutputPass())

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(this.canvas.parentElement ?? this.canvas)
    this.resize()
  }

  protected addStarfield(radius: number) {
    const N = 4200
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
      let y = banded ? u * 0.18 : u
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const p = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta))
      if (banded) p.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5)
      p.multiplyScalar(radius * (0.9 + Math.random() * 0.1))
      pos.set([p.x, p.y, p.z], i * 3)
      const warm = Math.random()
      c.setHSL(warm > 0.85 ? 0.08 : 0.58 + Math.random() * 0.06, 0.4, 0.62 + Math.random() * 0.3)
      col.set([c.r, c.g, c.b], i * 3)
      size[i] = 0.6 + Math.random() * 2.4
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
      uniforms: { uPixelRatio: { value: this.renderer.getPixelRatio() }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
    })
    const stars = new THREE.Points(geo, mat)
    stars.frustumCulled = false
    this.scene.add(stars)
    this.timedMats.push(mat)
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
