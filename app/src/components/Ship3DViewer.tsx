// Interactive 3D Starship Viewer with 360-degree pointer drag rotation,
// pinch/wheel zoom, wireframe/hologram mode toggle, and detailed Three.js geometry.

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Props {
  shipId: string
  shipName: string
  className?: string
}

export default function Ship3DViewer({ shipId, shipName, className = '' }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)

  const controlsRef = useRef<{
    setWireframe: (wf: boolean) => void
    setAutoRotate: (ar: boolean) => void
    resetCamera: () => void
    zoomIn: () => void
    zoomOut: () => void
  } | null>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(2.8, 1.8, 3.8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2)
    keyLight.position.set(5, 8, 6)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    fillLight.position.set(-5, -2, -4)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffedd5, 1.5)
    rimLight.position.set(0, 5, -6)
    scene.add(rimLight)

    // Ship Model Root Group
    const shipGroup = new THREE.Group()
    scene.add(shipGroup)

    const materials: THREE.Material[] = []
    const geometries: THREE.BufferGeometry[] = []

    function trackMat<T extends THREE.Material>(mat: T): T {
      materials.push(mat)
      return mat
    }

    function trackGeo<T extends THREE.BufferGeometry>(geo: T): T {
      geometries.push(geo)
      return geo
    }

    // Hologram circular pedestal ring
    const pedestalGeo = trackGeo(new THREE.RingGeometry(0.2, 1.8, 32))
    pedestalGeo.rotateX(-Math.PI / 2)
    const pedestalMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.25 }))
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
    pedestal.position.y = -1.2
    scene.add(pedestal)

    // Shared PBR materials
    const impGray = trackMat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.45, metalness: 0.65 }))
    const impDark = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 }))
    const rebWhite = trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.5 }))
    const rebRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5, metalness: 0.3 }))
    const rebYellow = trackMat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.3 }))
    const canopyGlass = trackMat(new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1, metalness: 0.95 }))
    const tieSolar = trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.85 }))
    const thrusterCyan = trackMat(new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0 }))
    const thrusterRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0xdc2626, emissiveIntensity: 2.0 }))
    const holoWireMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.85 }))

    // Model generators
    function buildFalcon(): THREE.Group {
      const g = new THREE.Group()
      // Main saucer hull
      const disc = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.6, 1.6, 0.38, 32)), rebWhite)
      g.add(disc)

      // Forward mandibles
      const mGeo = trackGeo(new THREE.BoxGeometry(0.48, 0.32, 1.2))
      const m1 = new THREE.Mesh(mGeo, rebWhite)
      m1.position.set(-0.6, 0, 1.5)
      const m2 = new THREE.Mesh(mGeo, rebWhite)
      m2.position.set(0.6, 0, 1.5)
      g.add(m1, m2)

      // Cockpit cylinder and cone
      const cockTube = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.9, 16)), impGray)
      cockTube.rotation.x = Math.PI / 2
      cockTube.position.set(1.45, 0.1, 0.6)
      const cockCone = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.24, 0.5, 16)), canopyGlass)
      cockCone.rotation.x = Math.PI / 2
      cockCone.position.set(1.45, 0.1, 1.2)
      g.add(cockTube, cockCone)

      // Dorsal radar dish
      const dish = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 16)), impGray)
      dish.position.set(-0.6, 0.35, -0.2)
      dish.rotation.x = 0.35
      g.add(dish)

      // Aft ion engine light strip
      const engineStrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.9, 0.14, 0.1)), thrusterCyan)
      engineStrip.position.set(0, 0, -1.6)
      g.add(engineStrip)

      return g
    }

    function buildStarDestroyer(): THREE.Group {
      const g = new THREE.Group()
      // Main triangular dagger wedge
      const wedgeGeo = trackGeo(new THREE.ConeGeometry(1.8, 4.4, 3))
      wedgeGeo.rotateX(Math.PI / 2)
      wedgeGeo.scale(1, 0.22, 1)
      const wedge = new THREE.Mesh(wedgeGeo, impGray)
      g.add(wedge)

      // Keel ridge
      const keel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.3, 0.2, 2.8)), impDark)
      keel.position.set(0, -0.22, 0)
      g.add(keel)

      // Stepped tier 1 superstructure
      const tier1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.0, 0.18, 1.4)), impGray)
      tier1.position.set(0, 0.2, -0.6)
      g.add(tier1)

      // Bridge tower
      const tower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.65, 0.38, 0.4)), impDark)
      tower.position.set(0, 0.42, -1.0)
      g.add(tower)

      // Bridge brow
      const brow = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.85, 0.14, 0.2)), impGray)
      brow.position.set(0, 0.58, -0.9)
      g.add(brow)

      // Deflector shield sensor globes
      const g1 = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.12, 12, 12)), impGray)
      g1.position.set(-0.45, 0.72, -0.9)
      const g2 = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.12, 12, 12)), impGray)
      g2.position.set(0.45, 0.72, -0.9)
      g.add(g1, g2)

      // 3 Main ion engines
      for (const [x, y] of [[-0.45, 0], [0.45, 0], [0, 0.18]]) {
        const eng = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 16)), impDark)
        eng.rotation.x = Math.PI / 2
        eng.position.set(x, y, -2.2)
        const nozzle = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.17, 16)), thrusterCyan)
        nozzle.rotation.y = Math.PI
        nozzle.position.set(x, y, -2.46)
        g.add(eng, nozzle)
      }

      return g
    }

    function buildXWing(): THREE.Group {
      const g = new THREE.Group()
      // Long tapered fuselage
      const body = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.32, 3.4, 4)), rebWhite)
      body.rotation.x = Math.PI / 2
      body.scale.set(0.9, 0.7, 1)
      g.add(body)

      // Cockpit canopy
      const canopy = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.18, 0.7)), canopyGlass)
      canopy.position.set(0, 0.14, -0.1)
      g.add(canopy)

      // 4 S-foils in attack mode
      const wGeo = trackGeo(new THREE.BoxGeometry(1.4, 0.05, 0.75))
      const stripeGeo = trackGeo(new THREE.BoxGeometry(0.35, 0.06, 0.7))
      const cannonGeo = trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8))
      cannonGeo.rotateX(Math.PI / 2)

      const angles = [Math.PI / 9, -Math.PI / 9]
      for (const a of angles) {
        for (const sign of [-1, 1]) {
          const wingGroup = new THREE.Group()
          const wing = new THREE.Mesh(wGeo, rebWhite)
          wing.position.x = sign * 0.8
          wingGroup.add(wing)

          // Red squadron stripe
          const stripe = new THREE.Mesh(stripeGeo, rebRed)
          stripe.position.set(sign * 1.3, 0, 0)
          wingGroup.add(stripe)

          // Laser cannon barrel
          const cannon = new THREE.Mesh(cannonGeo, impDark)
          cannon.position.set(sign * 1.5, 0, 0.5)
          wingGroup.add(cannon)

          // Engine nacelle
          const eng = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12)), impDark)
          eng.rotation.x = Math.PI / 2
          eng.position.set(sign * 0.28, 0, -0.55)
          const glow = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.11, 12)), thrusterRed)
          glow.rotation.y = Math.PI
          glow.position.set(sign * 0.28, 0, -1.01)
          wingGroup.add(eng, glow)

          wingGroup.rotation.z = sign * a
          g.add(wingGroup)
        }
      }

      return g
    }

    function buildSlaveI(): THREE.Group {
      const g = new THREE.Group()
      // Iconic rounded oval cockpit hull
      const dome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(1.1, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2)), impGray)
      dome.scale.set(0.8, 1.5, 0.7)
      dome.rotation.x = Math.PI / 2
      g.add(dome)

      // Ventral drive skirt / housing
      const skirt = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.0, 1.3, 0.45, 24)), impDark)
      skirt.position.set(0, -0.6, -0.3)
      skirt.rotation.x = 0.3
      g.add(skirt)

      // Cockpit canopy window
      const win = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.35, 0.55, 0.2)), canopyGlass)
      win.position.set(0, 0.8, 0.4)
      g.add(win)

      // Twin rotating stabilization wings
      for (const sign of [-1, 1]) {
        const wing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.85, 0.1, 0.45)), impGray)
        wing.position.set(sign * 1.3, -0.4, 0)
        g.add(wing)
      }

      // Twin blaster cannons
      const b1 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8)), impDark)
      b1.rotation.x = Math.PI / 2
      b1.position.set(-0.35, -0.9, 0.6)
      const b2 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8)), impDark)
      b2.rotation.x = Math.PI / 2
      b2.position.set(0.35, -0.9, 0.6)
      g.add(b1, b2)

      return g
    }

    function buildVenator(): THREE.Group {
      const g = new THREE.Group()
      // Dagger hull with Republic red trim
      const wedgeGeo = trackGeo(new THREE.ConeGeometry(1.9, 4.2, 3))
      wedgeGeo.rotateX(Math.PI / 2)
      wedgeGeo.scale(1, 0.22, 1)
      const wedge = new THREE.Mesh(wedgeGeo, impGray)
      g.add(wedge)

      // Red Republic dorsal hangar door stripe
      const redStrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.35, 0.05, 2.4)), rebRed)
      redStrip.position.set(0, 0.15, 0.2)
      g.add(redStrip)

      // Dual command bridge towers (Clone Wars signature)
      for (const sign of [-1, 1]) {
        const tower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.3, 0.42, 0.35)), impDark)
        tower.position.set(sign * 0.42, 0.42, -0.9)
        g.add(tower)
      }

      // 4 Main ion thrusters
      for (const [x, y] of [[-0.4, 0.08], [0.4, 0.08], [-0.25, -0.08], [0.25, -0.08]]) {
        const thr = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.16, 0.19, 0.45, 12)), impDark)
        thr.rotation.x = Math.PI / 2
        thr.position.set(x, y, -2.1)
        const glow = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.15, 12)), thrusterCyan)
        glow.rotation.y = Math.PI
        glow.position.set(x, y, -2.33)
        g.add(thr, glow)
      }

      return g
    }

    function buildRazorCrest(): THREE.Group {
      const g = new THREE.Group()
      // Main rugged gunship fuselage
      const fuselage = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.0, 0.7, 2.6)), impGray)
      g.add(fuselage)

      // Sloped front cockpit
      const nose = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.65, 0.9, 4)), impDark)
      nose.rotation.x = Math.PI / 2
      nose.position.set(0, 0.05, 1.5)
      g.add(nose)

      // Twin massive sublight turbofan nacelle engines
      for (const sign of [-1, 1]) {
        const nacelle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 2.2, 16)), impDark)
        nacelle.rotation.x = Math.PI / 2
        nacelle.position.set(sign * 1.15, 0.25, -0.2)

        const pylon = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.4, 0.12, 0.7)), impGray)
        pylon.position.set(sign * 0.7, 0.2, -0.2)

        const glow = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.38, 16)), thrusterCyan)
        glow.rotation.y = Math.PI
        glow.position.set(sign * 1.15, 0.25, -1.31)

        g.add(nacelle, pylon, glow)
      }

      // Twin heavy chin blaster cannons
      for (const sign of [-1, 1]) {
        const gun = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8)), impDark)
        gun.rotation.x = Math.PI / 2
        gun.position.set(sign * 0.35, -0.2, 1.8)
        g.add(gun)
      }

      return g
    }

    function buildExecutor(): THREE.Group {
      const g = new THREE.Group()
      // Ultra-elongated 19km razor needle dagger hull
      const hullGeo = trackGeo(new THREE.ConeGeometry(1.2, 6.0, 3))
      hullGeo.rotateX(Math.PI / 2)
      hullGeo.scale(1, 0.15, 1)
      const hull = new THREE.Mesh(hullGeo, impDark)
      g.add(hull)

      // Central sprawling trench city superstructure
      const city = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.18, 3.2)), impGray)
      city.position.set(0, 0.1, -0.6)
      g.add(city)

      // Command tower
      const tower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.35, 0.2, 0.25)), impDark)
      tower.position.set(0, 0.26, -1.8)
      g.add(tower)

      // Rear battery of 13 ion engines
      for (let i = -3; i <= 3; i++) {
        const eng = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.06, 8)), thrusterCyan)
        eng.rotation.y = Math.PI
        eng.position.set(i * 0.14, 0, -3.01)
        g.add(eng)
      }

      return g
    }

    function buildGhost(): THREE.Group {
      const g = new THREE.Group()
      // Bulky Corellian freighter hull
      const main = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.75, 2.5)), rebWhite)
      g.add(main)

      // Forward cockpit snout
      const nose = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.8, 0.45, 0.8)), impDark)
      nose.position.set(0, -0.08, 1.4)
      g.add(nose)

      // 360 dorsal laser turret dome
      const turret = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.32, 12, 12)), canopyGlass)
      turret.position.set(0, 0.45, 0.3)
      g.add(turret)

      // Aft docked Phantom auxiliary shuttle
      const phantom = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.35, 0.8, 4)), rebYellow)
      phantom.rotation.x = Math.PI / 2
      phantom.position.set(0, 0.28, -1.35)
      g.add(phantom)

      // Triple sublight engines
      for (const x of [-0.65, 0, 0.65]) {
        const glow = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.2, 12)), thrusterCyan)
        glow.rotation.y = Math.PI
        glow.position.set(x, -0.05, -1.26)
        g.add(glow)
      }

      return g
    }

    function buildTantiveIV(): THREE.Group {
      const g = new THREE.Group()
      // Cylindrical corridor hull
      const hull = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.36, 0.36, 2.8, 16)), rebWhite)
      hull.rotation.x = Math.PI / 2
      g.add(hull)

      // Hammerhead bridge module
      const hammer = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 1.6, 16)), rebWhite)
      hammer.position.set(0, 0, 1.4)
      const hammerWindow = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.15, 0.45)), canopyGlass)
      hammerWindow.position.set(0, 0.22, 1.4)
      g.add(hammer, hammerWindow)

      // Red Diplomatic consular stripes
      const stripe = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.37, 0.37, 0.4, 16)), rebRed)
      stripe.rotation.x = Math.PI / 2
      stripe.position.set(0, 0, 0.3)
      g.add(stripe)

      // Rear 11-engine block
      const positions: [number, number][] = [
        [-0.55, 0.4], [0, 0.4], [0.55, 0.4],
        [-0.7, 0], [-0.25, 0], [0.25, 0], [0.7, 0],
        [-0.55, -0.4], [0, -0.4], [0.55, -0.4],
        [0, 0]
      ]
      for (const [x, y] of positions) {
        const eng = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.65, 12)), impDark)
        eng.rotation.x = Math.PI / 2
        eng.position.set(x, y, -1.6)
        const glow = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.11, 12)), thrusterRed)
        glow.rotation.y = Math.PI
        glow.position.set(x, y, -1.93)
        g.add(eng, glow)
      }

      return g
    }

    function buildTIEInterceptor(): THREE.Group {
      const g = new THREE.Group()
      // Central spherical cockpit pod
      const pod = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.55, 16, 16)), impDark)
      g.add(pod)

      // Octagonal front viewport
      const vp = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 8)), canopyGlass)
      vp.rotation.x = Math.PI / 2
      vp.position.set(0, 0, 0.52)
      g.add(vp)

      // Structural pylons
      const pylon = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8)), impGray)
      pylon.rotation.z = Math.PI / 2
      g.add(pylon)

      // 4 Dagger solar array wings
      for (const signX of [-1, 1]) {
        for (const signY of [-1, 1]) {
          const daggerGeo = trackGeo(new THREE.ConeGeometry(0.7, 2.2, 3))
          daggerGeo.rotateX(Math.PI / 2)
          daggerGeo.scale(0.04, 1, 1)
          const dagger = new THREE.Mesh(daggerGeo, tieSolar)
          dagger.position.set(signX * 1.1, signY * 0.45, 0.3)
          dagger.rotation.z = signX * signY * -0.2

          // Laser cannon on dagger tip
          const cannon = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6)), impDark)
          cannon.rotation.x = Math.PI / 2
          cannon.position.set(signX * 1.12, signY * 0.45, 1.4)

          g.add(dagger, cannon)
        }
      }

      // Twin red ion engine exhausts
      const glow1 = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.07, 8)), thrusterRed)
      glow1.rotation.y = Math.PI
      glow1.position.set(-0.15, -0.05, -0.56)
      const glow2 = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.07, 8)), thrusterRed)
      glow2.rotation.y = Math.PI
      glow2.position.set(0.15, -0.05, -0.56)
      g.add(glow1, glow2)

      return g
    }

    // Select builder
    let model: THREE.Group
    switch (shipId) {
      case 'millennium-falcon':
        model = buildFalcon()
        break
      case 'imperial-star-destroyer':
        model = buildStarDestroyer()
        break
      case 't-65b-x-wing':
        model = buildXWing()
        break
      case 'slave-i':
        model = buildSlaveI()
        break
      case 'venator-star-destroyer':
        model = buildVenator()
        break
      case 'razor-crest':
        model = buildRazorCrest()
        break
      case 'executor-star-dreadnought':
        model = buildExecutor()
        break
      case 'ghost-vcx-100':
        model = buildGhost()
        break
      case 'tantive-iv':
        model = buildTantiveIV()
        break
      case 'tie-interceptor':
        model = buildTIEInterceptor()
        break
      default:
        model = buildFalcon()
        break
    }

    shipGroup.add(model)

    // Wireframe applicator
    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        originalMaterials.set(child, child.material)
      }
    })

    function applyWireframe(wf: boolean) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (wf) {
            child.material = holoWireMat
          } else {
            child.material = originalMaterials.get(child) ?? impGray
          }
        }
      })
    }

    // Interactive pointer orbit controls
    let isDragging = false
    let prevPointerX = 0
    let prevPointerY = 0
    let rotX = 0.2
    let rotY = -0.5
    let targetRotX = 0.2
    let targetRotY = -0.5
    let camDistance = 4.8
    let targetCamDistance = 4.8

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      prevPointerX = e.clientX
      prevPointerY = e.clientY
      container.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - prevPointerX
      const dy = e.clientY - prevPointerY
      prevPointerX = e.clientX
      prevPointerY = e.clientY
      targetRotY += dx * 0.008
      targetRotX += dy * 0.008
      targetRotX = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, targetRotX))
    }

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false
      try {
        container.releasePointerCapture(e.pointerId)
      } catch {
        // pointer capture already released
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      targetCamDistance += e.deltaY * 0.005
      targetCamDistance = Math.max(2.0, Math.min(8.5, targetCamDistance))
    }

    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointercancel', onPointerUp)
    container.addEventListener('wheel', onWheel, { passive: false })

    let shouldAutoRotate = true

    // Expose control ref
    controlsRef.current = {
      setWireframe: (wf) => applyWireframe(wf),
      setAutoRotate: (ar) => {
        shouldAutoRotate = ar
      },
      resetCamera: () => {
        targetRotX = 0.2
        targetRotY = -0.5
        targetCamDistance = 4.8
      },
      zoomIn: () => {
        targetCamDistance = Math.max(2.0, targetCamDistance - 0.8)
      },
      zoomOut: () => {
        targetCamDistance = Math.min(8.5, targetCamDistance + 0.8)
      },
    }

    // Resize Observer
    const ro = new ResizeObserver(() => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(container)

    // Render loop
    let reqId = 0
    let lastTime = performance.now()

    const animate = (time: number) => {
      reqId = requestAnimationFrame(animate)
      const dt = (time - lastTime) / 1000
      lastTime = time

      // Auto rotation when not dragging
      if (shouldAutoRotate && !isDragging) {
        targetRotY += dt * 0.25
      }

      // Smooth interpolation
      rotX += (targetRotX - rotX) * 0.1
      rotY += (targetRotY - rotY) * 0.1
      camDistance += (targetCamDistance - camDistance) * 0.1

      shipGroup.rotation.x = rotX
      shipGroup.rotation.y = rotY

      // Position camera based on distance
      camera.position.set(
        Math.sin(rotY * 0.2) * 0.5,
        1.2 + Math.sin(rotX) * 0.5,
        camDistance,
      )
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    reqId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(reqId)
      ro.disconnect()
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointercancel', onPointerUp)
      container.removeEventListener('wheel', onWheel)

      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      for (const g of geometries) g.dispose()
      for (const m of materials) m.dispose()
    }
  }, [shipId])

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-xl border border-holo-cyan/30 bg-black/80 backdrop-blur-md ${className}`}>
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        role="img"
        aria-label={`${shipName} 3D Tactical Model`}
        className="relative h-72 sm:h-84 md:h-96 w-full cursor-grab active:cursor-grabbing select-none"
      />

      {/* Interactive Controls Overlay */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 p-1.5 backdrop-blur-md">
        <span className="font-hud text-[10px] uppercase tracking-wider text-holo-cyan px-1.5">
          3D HOLO-VIEW
        </span>

        <button
          type="button"
          onClick={() => {
            const next = !autoRotate
            setAutoRotate(next)
            controlsRef.current?.setAutoRotate(next)
          }}
          title="Otomatik Dönüş (Auto-spin)"
          className={`rounded px-2 py-1 font-hud text-[10px] transition-all ${
            autoRotate
              ? 'bg-holo-cyan/20 text-holo-cyan border border-holo-cyan/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔄 {autoRotate ? 'Dönüş Açık' : 'Dönüş Kapalı'}
        </button>

        <button
          type="button"
          onClick={() => {
            const next = !wireframe
            setWireframe(next)
            controlsRef.current?.setWireframe(next)
          }}
          title="Hologram / Tel Çerçeve Modu"
          className={`rounded px-2 py-1 font-hud text-[10px] transition-all ${
            wireframe
              ? 'bg-holo-cyan/30 text-holo-cyan border border-holo-cyan/70 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📐 {wireframe ? 'Hologram Aktif' : 'PBR Model'}
        </button>

        <button
          type="button"
          onClick={() => controlsRef.current?.resetCamera()}
          title="Açıyı Sıfırla"
          className="rounded px-2 py-1 font-hud text-[10px] text-slate-400 hover:text-slate-200"
        >
          ↺ Sıfırla
        </button>

        <div className="hidden sm:flex items-center gap-1 border-l border-white/10 pl-1.5">
          <button
            type="button"
            onClick={() => controlsRef.current?.zoomIn()}
            title="Yakınlaştır"
            className="rounded px-1.5 py-0.5 font-hud text-[11px] text-slate-400 hover:text-holo-cyan"
          >
            ➕
          </button>
          <button
            type="button"
            onClick={() => controlsRef.current?.zoomOut()}
            title="Uzaklaştır"
            className="rounded px-1.5 py-0.5 font-hud text-[11px] text-slate-400 hover:text-holo-cyan"
          >
            ➖
          </button>
        </div>
      </div>

      {/* Interaction Hint Bottom Badge */}
      <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-white/10 bg-black/70 px-2.5 py-1 font-hud text-[10px] text-slate-400 backdrop-blur-xs">
        🖱️ 360° Döndürmek için sürükleyin · Yakınlaştırmak için tekerlek
      </div>
    </div>
  )
}
