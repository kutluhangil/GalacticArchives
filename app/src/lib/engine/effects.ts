// Liveliness-pass effect builders shared by PlanetEngine and SystemEngine:
// aurora curtains, lava sparks, mist shells, lightning columns, procedural
// Death Stars, destroyed-world asteroid fields and ambient ship traffic.
// Every builder returns objects whose materials expose a uTime uniform the
// caller ticks each frame (cheap uniform updates, no per-frame allocation).

import * as THREE from 'three'
import {
  ASTEROID_FRAG,
  ASTEROID_VERT,
  AURORA_FRAG,
  AURORA_VERT,
  BOLT_FRAG,
  BOLT_VERT,
  DEATHSTAR_FRAG,
  MIST_FRAG,
  PLANET_VERT,
  SPARK_FRAG,
  SPARK_VERT,
} from './planet-shaders'

export interface TimedEffect {
  object: THREE.Object3D
  materials: THREE.ShaderMaterial[]
}

/** Aurora curtains over both poles (ice worlds). */
export function buildAuroras(radius: number, colorA: string, colorB: string): TimedEffect {
  const group = new THREE.Group()
  const materials: THREE.ShaderMaterial[] = []
  for (const sign of [1, -1]) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: AURORA_VERT,
      fragmentShader: AURORA_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    // open cylinder hugging the polar circle, flaring slightly outward
    const geo = new THREE.CylinderGeometry(
      radius * 0.46,
      radius * 0.4,
      radius * 0.22,
      96,
      1,
      true,
    )
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.y = sign * radius * 0.92
    if (sign < 0) mesh.rotation.x = Math.PI
    group.add(mesh)
    materials.push(mat)
  }
  return { object: group, materials }
}

/** Rising ember sparks above lava channels (Points on the sphere). */
export function buildSparks(count: number, pixelRatio: number): TimedEffect {
  const dir = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  const speed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    // random point on sphere, biased to low latitudes where channels read best
    const u = (Math.random() * 2 - 1) * 0.8
    const th = Math.random() * Math.PI * 2
    const r = Math.sqrt(1 - u * u)
    dir.set([r * Math.cos(th), u, r * Math.sin(th)], i * 3)
    phase[i] = Math.random()
    speed[i] = 0.12 + Math.random() * 0.2
  }
  const geo = new THREE.BufferGeometry()
  // Points needs a position attribute even though the vertex shader ignores it
  geo.setAttribute('position', new THREE.BufferAttribute(dir.slice(), 3))
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
  const mat = new THREE.ShaderMaterial({
    vertexShader: SPARK_VERT,
    fragmentShader: SPARK_FRAG,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return { object: points, materials: [mat] }
}

/** Translucent seeping-mist shell (Dathomir red haze). */
export function buildMistShell(radius: number, color: string, seed: number): TimedEffect {
  const mat = new THREE.ShaderMaterial({
    vertexShader: PLANET_VERT,
    fragmentShader: MIST_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seed },
      uColor: { value: new THREE.Color(color) },
    },
    transparent: true,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), mat)
  return { object: mesh, materials: [mat] }
}

/** Vertical lightning columns rising from the surface (Exegol). */
export function buildLightningColumns(count: number, radius: number): TimedEffect {
  const group = new THREE.Group()
  const materials: THREE.ShaderMaterial[] = []
  for (let i = 0; i < count; i++) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: BOLT_VERT,
      fragmentShader: BOLT_FRAG,
      uniforms: { uTime: { value: 0 }, uId: { value: i * 1.618 } },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(radius * 0.3, radius * 0.5), mat)
    const u = Math.random() * 2 - 1
    const th = (i / count) * Math.PI * 2 + Math.random() * 0.6
    const r = Math.sqrt(1 - u * u)
    const dir = new THREE.Vector3(r * Math.cos(th), u, r * Math.sin(th))
    plane.position.copy(dir.clone().multiplyScalar(radius * 1.22))
    // orient the column to stand radially outward
    plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    group.add(plane)
    materials.push(mat)
  }
  return { object: group, materials }
}

/** Procedural Death Star mesh. `half` renders the DS-2 scaffold state. */
export function buildDeathStar(radius: number, half: boolean, seed: number): TimedEffect {
  const dishDir = new THREE.Vector3(0.62, 0.55, 0.56).normalize()
  const mat = new THREE.ShaderMaterial({
    vertexShader: PLANET_VERT,
    fragmentShader: DEATHSTAR_FRAG,
    uniforms: {
      uSeed: { value: seed },
      uTime: { value: 0 },
      uBuild: { value: half ? 0.6 : 1 },
      uSun1Dir: { value: new THREE.Vector3(1, 0.3, 0).normalize() },
      uSun1Color: { value: new THREE.Color('#FFEFD0') },
      uDishDir: { value: dishDir },
      // unbuilt cap sits opposite the dish so both read in one view
      uCapDir: { value: new THREE.Vector3(-0.75, -0.2, 0.63).normalize() },
    },
    // the open scaffold lets you see the shell's far side from inside
    side: half ? THREE.DoubleSide : THREE.FrontSide,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 96), mat)
  return { object: mesh, materials: [mat] }
}

/** Spinning ring habitat with a lit inner city band. Unlike a Death Star this
 * is deliberately open at its centre, so its silhouette reads as an orbital
 * habitat at both close and system-view scales. */
export function buildRingworld(radius: number, seed: number): TimedEffect {
  const group = new THREE.Group()
  const hull = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#68717d'),
    metalness: 0.86,
    roughness: 0.34,
  })
  const habitat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#172333'),
    emissive: new THREE.Color('#4eaac9'),
    emissiveIntensity: 1.25,
    metalness: 0.35,
    roughness: 0.52,
    side: THREE.BackSide,
  })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.16, 20, 128), hull)
  ring.rotation.x = Math.PI / 2
  const inner = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.105, 16, 128), habitat)
  inner.rotation.x = Math.PI / 2
  group.add(ring, inner)

  const lights = new THREE.Group()
  const lightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#8cecff') })
  const count = 24 + (seed % 12)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const light = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.06, radius * 0.018, radius * 0.04), lightMat)
    light.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
    light.rotation.z = angle
    lights.add(light)
  }
  lights.rotation.x = Math.PI / 2
  group.add(lights)
  return { object: group, materials: [] }
}

export function buildStationBody(body: { id: string; renderRecipe: { stationVisual?: 'death-star' | 'ringworld'; effects?: string[] } }, radius: number, seed: number): TimedEffect {
  if (body.renderRecipe.stationVisual === 'ringworld') return buildRingworld(radius, seed)
  return buildDeathStar(radius, (body.renderRecipe.effects ?? []).includes('half-built-scaffold'), seed)
}

/** Slow-tumbling asteroid disk (Alderaan graveyard / destroyed worlds). */
export function buildAsteroidField(
  count: number,
  innerR: number,
  outerR: number,
  sunDir: THREE.Vector3,
  sunColor: THREE.Color,
): { object: THREE.Group; update: (dt: number) => void; materials: THREE.ShaderMaterial[] } {
  const geo = new THREE.IcosahedronGeometry(1, 0)
  const mat = new THREE.ShaderMaterial({
    vertexShader: ASTEROID_VERT,
    fragmentShader: ASTEROID_FRAG,
    uniforms: {
      uSun1Dir: { value: sunDir.clone() },
      uSun1Color: { value: sunColor.clone() },
    },
  })
  const mesh = new THREE.InstancedMesh(geo, mat, count)
  const shade = new Float32Array(count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const r = innerR + Math.random() * (outerR - innerR)
    const a = Math.random() * Math.PI * 2
    // thick torus rather than a flat ring: a shattered world leaves a cloud,
    // densest in the old orbital plane but far from a disc
    const tilt = (Math.random() - 0.5) * 0.85
    dummy.position.set(Math.cos(a) * r * Math.cos(tilt), Math.sin(tilt) * r * 0.75, Math.sin(a) * r * Math.cos(tilt))
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    const s = 0.012 + Math.pow(Math.random(), 2.2) * 0.075
    dummy.scale.set(s, s * (0.6 + Math.random() * 0.8), s)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    shade[i] = Math.random()
  }
  geo.setAttribute('aShade', new THREE.InstancedBufferAttribute(shade, 1))
  mesh.instanceMatrix.needsUpdate = true
  const group = new THREE.Group()
  group.add(mesh)
  // dust haze: many small motes rather than one sprite, which read as a ghost
  // sphere behind the rocks
  const M = Math.round(count * 1.6)
  const mpos = new Float32Array(M * 3)
  for (let i = 0; i < M; i++) {
    const r = innerR * 0.8 + Math.random() * (outerR - innerR) * 1.25
    const a = Math.random() * Math.PI * 2
    const tilt = (Math.random() - 0.5) * 1.1
    mpos.set(
      [Math.cos(a) * r * Math.cos(tilt), Math.sin(tilt) * r * 0.8, Math.sin(a) * r * Math.cos(tilt)],
      i * 3,
    )
  }
  const mgeo = new THREE.BufferGeometry()
  mgeo.setAttribute('position', new THREE.BufferAttribute(mpos, 3))
  const motes = new THREE.Points(
    mgeo,
    new THREE.PointsMaterial({
      color: new THREE.Color('#9fb0c6'),
      map: makeGlowTexture('#ffffff'),
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  group.add(motes)
  const update = (dt: number) => {
    group.rotation.y += dt * 0.012 // slow mournful drift
  }
  return { object: group, update, materials: [mat] }
}

/** Radial-gradient glow sprite texture (cached per color). */
const glowCache = new Map<string, THREE.CanvasTexture>()
export function makeGlowTexture(color: string): THREE.CanvasTexture {
  const hit = glowCache.get(color)
  if (hit) return hit
  const cv = document.createElement('canvas')
  cv.width = cv.height = 64
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.25, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  glowCache.set(color, tex)
  return tex
}

// --- ambient 3D Star Wars ship traffic ---------------------------------------

// --- ambient 3D Star Wars ship & satellite traffic ---------------------------

// Realistic PBR materials with metallic luster and proper roughness
const imperialHullMat = new THREE.MeshStandardMaterial({
  color: 0x8a96a4,
  roughness: 0.45,
  metalness: 0.6,
})
const imperialDarkMat = new THREE.MeshStandardMaterial({
  color: 0x22272e,
  roughness: 0.6,
  metalness: 0.4,
})
const rebelAlloyMat = new THREE.MeshStandardMaterial({
  color: 0xdde3ea,
  roughness: 0.4,
  metalness: 0.5,
})
const rebelStripeMat = new THREE.MeshStandardMaterial({
  color: 0xd32f2f,
  roughness: 0.5,
  metalness: 0.25,
})
const tieSolarMat = new THREE.MeshStandardMaterial({
  color: 0x11161d,
  roughness: 0.8,
  metalness: 0.85,
})
const cockpitGlassMat = new THREE.MeshStandardMaterial({
  color: 0x0a1120,
  roughness: 0.1,
  metalness: 0.95,
})
const satelliteGoldMat = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  roughness: 0.25,
  metalness: 0.9,
})
const satelliteSolarMat = new THREE.MeshStandardMaterial({
  color: 0x1e40af,
  roughness: 0.2,
  metalness: 0.9,
})
const satelliteDishMat = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0,
  roughness: 0.35,
  metalness: 0.6,
})

/** Realistic Imperial Star Destroyer with multi-tier hull, bridge tower, globes and thrusters */
function createStarDestroyerMesh(): THREE.Group {
  const group = new THREE.Group()

  // Main triangular wedge hull
  const wedgeGeo = new THREE.ConeGeometry(0.045, 0.16, 3)
  wedgeGeo.rotateX(Math.PI / 2)
  wedgeGeo.scale(1, 0.25, 1)
  const wedge = new THREE.Mesh(wedgeGeo, imperialHullMat)
  group.add(wedge)

  // Keel ridge
  const keelGeo = new THREE.BoxGeometry(0.012, 0.008, 0.08)
  const keel = new THREE.Mesh(keelGeo, imperialDarkMat)
  keel.position.set(0, -0.012, 0.01)
  group.add(keel)

  // Stepped superstructure
  const superGeo = new THREE.BoxGeometry(0.026, 0.01, 0.04)
  const superMesh = new THREE.Mesh(superGeo, imperialHullMat)
  superMesh.position.set(0, 0.01, 0.02)
  group.add(superMesh)

  // Command bridge tower
  const bridgeGeo = new THREE.BoxGeometry(0.016, 0.014, 0.015)
  const bridge = new THREE.Mesh(bridgeGeo, imperialDarkMat)
  bridge.position.set(0, 0.018, 0.032)
  group.add(bridge)

  // Sensor deflector globes
  const globeGeo = new THREE.SphereGeometry(0.0035, 6, 6)
  const g1 = new THREE.Mesh(globeGeo, imperialHullMat)
  g1.position.set(-0.01, 0.026, 0.032)
  const g2 = new THREE.Mesh(globeGeo, imperialHullMat)
  g2.position.set(0.01, 0.026, 0.032)
  group.add(g1, g2)

  // Aft primary ion engines
  const engGeo = new THREE.CylinderGeometry(0.004, 0.005, 0.012, 8)
  engGeo.rotateX(Math.PI / 2)
  const e1 = new THREE.Mesh(engGeo, imperialDarkMat)
  e1.position.set(-0.012, 0, 0.08)
  const e2 = new THREE.Mesh(engGeo, imperialDarkMat)
  e2.position.set(0.012, 0, 0.08)
  const e3 = new THREE.Mesh(engGeo, imperialDarkMat)
  e3.position.set(0, 0.006, 0.08)
  group.add(e1, e2, e3)

  return group
}

/** T-65B X-Wing with S-foils, red squadron striping, and laser cannons */
function createXWingMesh(): THREE.Group {
  const group = new THREE.Group()

  // Long tapered fuselage
  const bodyGeo = new THREE.ConeGeometry(0.01, 0.09, 4)
  bodyGeo.rotateX(Math.PI / 2)
  const body = new THREE.Mesh(bodyGeo, rebelAlloyMat)
  group.add(body)

  // Dark tinted cockpit canopy
  const canopyGeo = new THREE.BoxGeometry(0.008, 0.006, 0.022)
  const canopy = new THREE.Mesh(canopyGeo, cockpitGlassMat)
  canopy.position.set(0, 0.004, -0.005)
  group.add(canopy)

  // 4 S-foil split wings
  const wingGeo = new THREE.BoxGeometry(0.036, 0.002, 0.025)
  const redGeo = new THREE.BoxGeometry(0.01, 0.0025, 0.02)
  const cannonGeo = new THREE.CylinderGeometry(0.0012, 0.0012, 0.04, 6)
  cannonGeo.rotateX(Math.PI / 2)

  const angles = [Math.PI / 7, -Math.PI / 7]
  for (const a of angles) {
    for (const sign of [-1, 1]) {
      const wingGroup = new THREE.Group()
      const wing = new THREE.Mesh(wingGeo, rebelAlloyMat)
      wing.position.x = sign * 0.022
      wingGroup.add(wing)

      // Red squadron markings on wingtips
      const stripe = new THREE.Mesh(redGeo, rebelStripeMat)
      stripe.position.set(sign * 0.036, 0, 0.002)
      wingGroup.add(stripe)

      // Laser cannon at tip
      const cannon = new THREE.Mesh(cannonGeo, imperialDarkMat)
      cannon.position.set(sign * 0.04, 0, -0.015)
      wingGroup.add(cannon)

      wingGroup.rotation.z = sign * a
      group.add(wingGroup)
    }
  }

  return group
}

/** Imperial TIE Fighter with central ball cockpit and hexagonal solar array wings */
function createTIEFighterMesh(): THREE.Group {
  const group = new THREE.Group()

  // Spherical command pod
  const podGeo = new THREE.SphereGeometry(0.013, 10, 10)
  const pod = new THREE.Mesh(podGeo, imperialDarkMat)
  group.add(pod)

  // Forward viewport window
  const vpGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.005, 8)
  vpGeo.rotateX(Math.PI / 2)
  const vp = new THREE.Mesh(vpGeo, cockpitGlassMat)
  vp.position.set(0, 0, -0.011)
  group.add(vp)

  // Structural wing pylons
  const pylonGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.05, 6)
  pylonGeo.rotateZ(Math.PI / 2)
  const pylon = new THREE.Mesh(pylonGeo, imperialHullMat)
  group.add(pylon)

  // Hexagonal vertical solar wings
  const wingGeo = new THREE.BoxGeometry(0.003, 0.065, 0.052)
  const strutGeo = new THREE.BoxGeometry(0.004, 0.068, 0.008)

  for (const sign of [-1, 1]) {
    const w = new THREE.Mesh(wingGeo, tieSolarMat)
    w.position.x = sign * 0.026
    const s1 = new THREE.Mesh(strutGeo, imperialHullMat)
    s1.position.x = sign * 0.026
    group.add(w, s1)
  }

  return group
}

/** YT-1300 Corellian Light Freighter (Falcon archetype) */
function createFreighterMesh(): THREE.Group {
  const group = new THREE.Group()

  // Circular saucer hull
  const saucerGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.008, 16)
  const saucer = new THREE.Mesh(saucerGeo, rebelAlloyMat)
  group.add(saucer)

  // Forward docking mandibles
  const mandGeo = new THREE.BoxGeometry(0.009, 0.007, 0.026)
  const m1 = new THREE.Mesh(mandGeo, rebelAlloyMat)
  m1.position.set(-0.012, 0, -0.025)
  const m2 = new THREE.Mesh(mandGeo, rebelAlloyMat)
  m2.position.set(0.012, 0, -0.025)
  group.add(m1, m2)

  // Starboard offset cockpit
  const tubeGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.016, 8)
  tubeGeo.rotateX(Math.PI / 2)
  const tube = new THREE.Mesh(tubeGeo, imperialHullMat)
  tube.position.set(0.028, 0, -0.01)
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.008, 8), cockpitGlassMat)
  canopy.rotateX(-Math.PI / 2)
  canopy.position.set(0.028, 0, -0.02)
  group.add(tube, canopy)

  // Dorsal round radar dish
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.002, 12), imperialHullMat)
  dish.position.set(-0.012, 0.006, 0.005)
  dish.rotation.x = 0.3
  group.add(dish)

  return group
}

/** Orbital Communications & Sensor Satellite with gold thermal MLI foil and blue solar arrays */
function createSatelliteMesh(): THREE.Group {
  const group = new THREE.Group()

  // Main central bus body wrapped in gold thermal foil
  const busGeo = new THREE.BoxGeometry(0.016, 0.016, 0.02)
  const bus = new THREE.Mesh(busGeo, satelliteGoldMat)
  group.add(bus)

  // Dual extended high-efficiency photovoltaic solar panel wings
  const panelGeo = new THREE.BoxGeometry(0.045, 0.022, 0.002)
  const frameGeo = new THREE.BoxGeometry(0.047, 0.003, 0.003)
  for (const sign of [-1, 1]) {
    const panel = new THREE.Mesh(panelGeo, satelliteSolarMat)
    panel.position.x = sign * 0.034
    const frame = new THREE.Mesh(frameGeo, imperialDarkMat)
    frame.position.x = sign * 0.034
    group.add(panel, frame)
  }

  // Parabolic high-gain communication dish pointed down toward the world
  const dishGeo = new THREE.ConeGeometry(0.014, 0.007, 12, 1, true)
  dishGeo.rotateX(Math.PI)
  const dish = new THREE.Mesh(dishGeo, satelliteDishMat)
  dish.position.set(0, -0.014, 0)
  group.add(dish)

  // Sensor mast / telemetry boom
  const boomGeo = new THREE.CylinderGeometry(0.001, 0.001, 0.025, 4)
  const boom = new THREE.Mesh(boomGeo, imperialHullMat)
  boom.position.set(0, 0.02, 0)
  group.add(boom)

  return group
}

/** Imperial / Neutral Lambda-style Tri-wing Cargo Shuttle */
function createCargoShuttleMesh(): THREE.Group {
  const group = new THREE.Group()

  // Sleek cockpit & main cargo hull
  const hullGeo = new THREE.ConeGeometry(0.014, 0.07, 4)
  hullGeo.rotateX(Math.PI / 2)
  const hull = new THREE.Mesh(hullGeo, imperialHullMat)
  group.add(hull)

  // Tall vertical dorsal fin stabilizer
  const dorsalGeo = new THREE.BoxGeometry(0.003, 0.045, 0.035)
  const dorsal = new THREE.Mesh(dorsalGeo, imperialHullMat)
  dorsal.position.set(0, 0.025, 0.01)
  group.add(dorsal)

  // Folding angled lower wings
  const wingGeo = new THREE.BoxGeometry(0.0025, 0.04, 0.03)
  for (const sign of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, imperialHullMat)
    wing.position.set(sign * 0.016, -0.018, 0.01)
    wing.rotation.z = sign * (Math.PI / 4)
    group.add(wing)
  }

  return group
}

interface TrafficLane {
  radius: number
  tilt: number
  phase: number
  speed: number
  node: THREE.Object3D
}

export interface TrafficSystem {
  group: THREE.Group
  /** advance ships along their lanes; center = world position of the host */
  update: (elapsed: number, center: THREE.Vector3) => void
}

/** Instanced ambient traffic orbiting a host body. Density per archetype:
 *  ecumenopolis worlds hum with ships, backwaters see the odd freighter. */
export function buildTraffic(count: number, hostRadius: number, planetId?: string): TrafficSystem {
  const group = new THREE.Group()
  const lanes: TrafficLane[] = []

  // Dedicated ambient light ensures all PBR metal/roughness surfaces pop with depth
  const trafficLight = new THREE.AmbientLight(0xffffff, 0.75)
  group.add(trafficLight)

  // Curate traffic roster per world
  let builders = [
    createStarDestroyerMesh,
    createXWingMesh,
    createTIEFighterMesh,
    createFreighterMesh,
    createSatelliteMesh,
    createCargoShuttleMesh,
  ]

  if (planetId === 'daiyu') {
    builders = [createFreighterMesh, createSatelliteMesh, createCargoShuttleMesh, createTIEFighterMesh]
  } else if (planetId === 'coruscant') {
    builders = [createStarDestroyerMesh, createCargoShuttleMesh, createTIEFighterMesh, createSatelliteMesh]
  } else if (planetId === 'tatooine' || planetId === 'ferrix') {
    builders = [createFreighterMesh, createSatelliteMesh, createCargoShuttleMesh]
  }

  for (let i = 0; i < count; i++) {
    const node = new THREE.Group()
    const shipBuilder = builders[i % builders.length]
    const shipMesh = shipBuilder()
    node.add(shipMesh)

    // engine glow trailing the hull (or subtle beacon for satellites)
    const isSat = shipBuilder === createSatelliteMesh
    const isImp = shipBuilder === createStarDestroyerMesh || shipBuilder === createTIEFighterMesh
    const glowColor = isSat ? '#FBBF24' : isImp ? '#FF3333' : '#66D9FF'
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(glowColor),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: isSat ? 0.6 : 0.9,
      }),
    )
    glow.scale.setScalar(isSat ? 0.04 : 0.07)
    glow.position.z = isSat ? 0.015 : 0.05
    node.add(glow)
    group.add(node)

    lanes.push({
      radius: hostRadius * (1.45 + Math.random() * 1.3),
      tilt: (Math.random() - 0.5) * 0.9,
      phase: Math.random() * Math.PI * 2,
      speed: (0.05 + Math.random() * 0.1) * (Math.random() < 0.5 ? 1 : -1),
      node,
    })
  }

  // hyperspace arrival streak: one ship occasionally blinks in with a light-line
  const streakMat = new THREE.SpriteMaterial({
    map: makeGlowTexture('#eaf6ff'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  })
  const streak = new THREE.Sprite(streakMat)
  streak.scale.set(0.9, 0.045, 1)
  group.add(streak)
  let nextArrival = 4 + Math.random() * 8

  const shipPos = new THREE.Vector3()
  const update = (elapsed: number, center: THREE.Vector3) => {
    for (const lane of lanes) {
      const a = lane.phase + elapsed * lane.speed
      shipPos.set(Math.cos(a) * lane.radius, 0, Math.sin(a) * lane.radius)
      shipPos.applyAxisAngle(AXIS_X, lane.tilt)
      lane.node.position.copy(center).add(shipPos)
      // face along the direction of travel
      const na = a + 0.01 * Math.sign(lane.speed)
      shipPos.set(Math.cos(na) * lane.radius, 0, Math.sin(na) * lane.radius)
      shipPos.applyAxisAngle(AXIS_X, lane.tilt)
      lane.node.lookAt(shipPos.add(center))
    }
    // hyperspace arrival flash
    if (elapsed > nextArrival) {
      const t = elapsed - nextArrival
      if (t < 0.55) {
        const lane = lanes[0]
        if (lane) {
          streak.position.copy(lane.node.position)
          streakMat.opacity = t < 0.12 ? t / 0.12 : Math.max(0, 1 - (t - 0.12) / 0.43)
          streak.scale.set(0.9 * (1 - t), 0.045, 1)
        }
      } else {
        streakMat.opacity = 0
        nextArrival = elapsed + 6 + Math.random() * 10
      }
    }
  }
  return { group, update }
}

const AXIS_X = new THREE.Vector3(1, 0, 0)
