// Runtime side of the texture pipeline. scripts/process-textures.mjs writes
// public/textures/planets/manifest.json; a world listed there gets its surface
// maps loaded lazily on arrival and blended over the procedural shader.
// Everything not listed stays fully procedural.

import * as THREE from 'three'
// type-only: the transcoder machinery is heavy and only needed once a world
// actually ships .ktx2 maps, so the loader is dynamically imported below.
import type { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { resolvedQuality } from '../quality'

type Kind = 'albedo' | 'night' | 'clouds'
type Manifest = Record<string, Partial<Record<Kind, Record<string, string>>>>

const BASE = '/textures/planets'
/** how many worlds' maps stay resident before the oldest is released */
const CACHE_LIMIT = 6

let manifestPromise: Promise<Manifest> | null = null
const cache = new Map<string, THREE.Texture>()
let ktx2Loader: KTX2Loader | null = null

function loadManifest(): Promise<Manifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${BASE}/manifest.json`)
      .then((res) => (res.ok ? res.json() : {}))
      // no manifest means no generated textures yet, which is a valid state
      .catch(() => ({}))
  }
  return manifestPromise
}

/** Ultra maps on a low tier would blow the GPU memory budget for no gain. */
function tierFor(available: Record<string, string>): string | null {
  const order = resolvedQuality() === 'high' ? ['4k', '2k', '1k'] : ['1k', '2k', '4k']
  return order.find((tier) => available[tier]) ?? null
}

async function loaderFor(file: string, renderer: THREE.WebGLRenderer) {
  if (!file.endsWith('.ktx2')) return new THREE.TextureLoader()
  if (!ktx2Loader) {
    const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js')
    ktx2Loader = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer)
  }
  return ktx2Loader
}

function evictOldest() {
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) return
    cache.get(oldest)?.dispose()
    cache.delete(oldest)
  }
}

async function loadMap(
  id: string,
  kind: Kind,
  renderer: THREE.WebGLRenderer,
): Promise<THREE.Texture | null> {
  const manifest = await loadManifest()
  const available = manifest[id]?.[kind]
  if (!available) return null
  const tier = tierFor(available)
  if (!tier) return null

  const key = `${id}/${kind}/${tier}`
  const hit = cache.get(key)
  if (hit) {
    // refresh recency
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }

  const url = `${BASE}/${id}/${available[tier]}`
  const loader = await loaderFor(available[tier], renderer)
  const texture = await loader.loadAsync(url)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
  texture.wrapS = THREE.RepeatWrapping
  cache.set(key, texture)
  evictOldest()
  return texture
}

/**
 * Blends generated surface maps into a body material once they arrive.
 * Returns immediately when the world has no generated textures.
 */
export async function applySurfaceTextures(
  id: string,
  material: THREE.ShaderMaterial,
  renderer: THREE.WebGLRenderer,
): Promise<void> {
  const [albedo, night] = await Promise.all([
    loadMap(id, 'albedo', renderer),
    loadMap(id, 'night', renderer),
  ])
  if (albedo) {
    material.uniforms.uAlbedo.value = albedo
    material.uniforms.uUseAlbedo.value = 1
  }
  if (night) {
    material.uniforms.uNight.value = night
    material.uniforms.uUseNight.value = 1
  }
  material.needsUpdate = true
}
