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
interface CacheEntry {
  texture: THREE.Texture
  references: number
}

export interface SurfaceTextureLease {
  release: () => void
}

const cache = new Map<string, CacheEntry>()
const pendingLoads = new Map<string, Promise<void>>()
// the promise, not the loader: albedo, night and moon maps ask in parallel, and
// each await gap used to start its own transcoder worker pool and WASM compile
let ktx2Loader: Promise<KTX2Loader> | null = null

function loadManifest(): Promise<Manifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${BASE}/manifest.json`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Texture manifest request failed: ${res.url || `${BASE}/manifest.json`} returned HTTP ${res.status}`)
        }
        const manifest: unknown = await res.json()
        if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
          throw new Error(`Texture manifest is invalid: expected an object at ${BASE}/manifest.json`)
        }
        return manifest as Manifest
      })
      .catch((error: unknown) => {
        manifestPromise = null
        throw error instanceof Error ? error : new Error(`Texture manifest request failed: ${String(error)}`)
      })
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
  ktx2Loader ??= import('three/examples/jsm/loaders/KTX2Loader.js').then(({ KTX2Loader }) =>
    new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer),
  )
  return ktx2Loader
}

function evictUnused() {
  while (cache.size > CACHE_LIMIT) {
    const oldestUnused = [...cache.entries()].find(([, entry]) => entry.references === 0)?.[0]
    if (!oldestUnused) return
    cache.get(oldestUnused)?.texture.dispose()
    cache.delete(oldestUnused)
  }
}

function acquire(key: string): SurfaceTextureLease & { texture: THREE.Texture } {
  const entry = cache.get(key)
  if (!entry) throw new Error(`Texture cache invariant failed: missing acquired key ${key}`)
  entry.references += 1
  cache.delete(key)
  cache.set(key, entry)
  let released = false
  return {
    texture: entry.texture,
    release: () => {
      if (released) return
      released = true
      entry.references -= 1
      if (entry.references < 0) throw new Error(`Texture cache invariant failed: negative references for ${key}`)
      evictUnused()
    },
  }
}

async function loadMap(
  id: string,
  kind: Kind,
  renderer: THREE.WebGLRenderer,
): Promise<(SurfaceTextureLease & { texture: THREE.Texture }) | null> {
  const manifest = await loadManifest()
  const available = manifest[id]?.[kind]
  if (!available) return null
  const tier = tierFor(available)
  if (!tier) return null

  const key = `${id}/${kind}/${tier}`
  if (cache.has(key)) return acquire(key)

  let pending = pendingLoads.get(key)
  if (!pending) {
    const url = `${BASE}/${id}/${available[tier]}`
    pending = loaderFor(available[tier], renderer)
      .then(async (loader) => {
        const texture = await loader.loadAsync(url)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
        texture.wrapS = THREE.RepeatWrapping
        cache.set(key, { texture, references: 0 })
      })
      .finally(() => pendingLoads.delete(key))
    pendingLoads.set(key, pending)
  }
  await pending
  const lease = acquire(key)
  evictUnused()
  return lease
}

/**
 * Blends generated surface maps into a body material once they arrive.
 * Returns immediately when the world has no generated textures.
 */
export async function applySurfaceTextures(
  id: string,
  material: THREE.ShaderMaterial,
  renderer: THREE.WebGLRenderer,
  signal?: AbortSignal,
): Promise<SurfaceTextureLease> {
  const maps = await Promise.allSettled([
    loadMap(id, 'albedo', renderer),
    loadMap(id, 'night', renderer),
  ])
  const failed = maps.find((map): map is PromiseRejectedResult => map.status === 'rejected')
  if (failed) {
    for (const map of maps) if (map.status === 'fulfilled') map.value?.release()
    throw failed.reason instanceof Error ? failed.reason : new Error(`Texture load failed for ${id}: ${String(failed.reason)}`)
  }
  const [albedoResult, nightResult] = maps as [
    PromiseFulfilledResult<(SurfaceTextureLease & { texture: THREE.Texture }) | null>,
    PromiseFulfilledResult<(SurfaceTextureLease & { texture: THREE.Texture }) | null>,
  ]
  const albedo = albedoResult.value
  const night = nightResult.value
  const release = () => {
    albedo?.release()
    night?.release()
  }
  if (signal?.aborted) {
    release()
    return { release: () => undefined }
  }
  if (albedo) {
    material.uniforms.uAlbedo.value = albedo.texture
    material.uniforms.uUseAlbedo.value = 1
  }
  if (night) {
    material.uniforms.uNight.value = night.texture
    material.uniforms.uUseNight.value = 1
  }
  material.needsUpdate = true
  return { release }
}
