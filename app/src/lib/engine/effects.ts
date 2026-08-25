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

const hullMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#d4e2f5') })
const darkHullMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#404a57') })

/** Star Destroyer wedge geometry */
function createStarDestroyerMesh(): THREE.Group {
  const group = new THREE.Group()
  const wedgeGeo = new THREE.ConeGeometry(0.04, 0.14, 3)
  wedgeGeo.rotateX(Math.PI / 2)
  wedgeGeo.scale(1, 0.3, 1)
  const wedge = new THREE.Mesh(wedgeGeo, hullMat)
  group.add(wedge)

  // Bridge tower
  const bridgeGeo = new THREE.BoxGeometry(0.02, 0.015, 0.02)
  const bridge = new THREE.Mesh(bridgeGeo, darkHullMat)
  bridge.position.set(0, 0.012, 0.02)
  group.add(bridge)
  return group
}

/** X-Wing Starfighter geometry */
function createXWingMesh(): THREE.Group {
  const group = new THREE.Group()
  const bodyGeo = new THREE.ConeGeometry(0.012, 0.08, 4)
  bodyGeo.rotateX(Math.PI / 2)
  const body = new THREE.Mesh(bodyGeo, hullMat)
  group.add(body)

  // Cross wings
  const wingGeo = new THREE.BoxGeometry(0.07, 0.003, 0.015)
  const wing1 = new THREE.Mesh(wingGeo, hullMat)
  wing1.rotation.z = Math.PI / 6
  const wing2 = new THREE.Mesh(wingGeo, hullMat)
  wing2.rotation.z = -Math.PI / 6
  group.add(wing1, wing2)
  return group
}

/** TIE Fighter geometry */
function createTIEFighterMesh(): THREE.Group {
  const group = new THREE.Group()
  const podGeo = new THREE.SphereGeometry(0.012, 8, 8)
  const pod = new THREE.Mesh(podGeo, darkHullMat)
  group.add(pod)

  const wingGeo = new THREE.BoxGeometry(0.002, 0.05, 0.04)
  const leftWing = new THREE.Mesh(wingGeo, darkHullMat)
  leftWing.position.x = -0.022
  const rightWing = new THREE.Mesh(wingGeo, darkHullMat)
  rightWing.position.x = 0.022
  group.add(leftWing, rightWing)
  return group
}

/** Freighter geometry (Falcon archetype) */
function createFreighterMesh(): THREE.Group {
  const group = new THREE.Group()
  const saucerGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.008, 12)
  const saucer = new THREE.Mesh(saucerGeo, hullMat)
  group.add(saucer)

  const cockpitGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.02, 8)
  cockpitGeo.rotateZ(Math.PI / 2)
  const cockpit = new THREE.Mesh(cockpitGeo, darkHullMat)
  cockpit.position.set(0.02, 0, -0.005)
  group.add(cockpit)
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
export function buildTraffic(count: number, hostRadius: number): TrafficSystem {
  const group = new THREE.Group()
  const lanes: TrafficLane[] = []

  const builders = [
    createStarDestroyerMesh,
    createXWingMesh,
    createTIEFighterMesh,
    createFreighterMesh,
  ]

  for (let i = 0; i < count; i++) {
    const node = new THREE.Group()
    const shipBuilder = builders[i % builders.length]
    const shipMesh = shipBuilder()
    node.add(shipMesh)

    // engine glow trailing the hull
    const isImperial = i % 2 === 0
    const glowColor = isImperial ? '#FF3333' : '#66D9FF'
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(glowColor),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.9,
      }),
    )
    glow.scale.setScalar(0.07)
    glow.position.z = 0.05
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
