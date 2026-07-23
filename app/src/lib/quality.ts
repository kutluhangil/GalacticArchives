// Render quality tiers, kept framework-free so the engines can read them
// without depending on React state. 'auto' resolves once per session from the
// device's own hints rather than a benchmark, so the first frame is already
// at the right tier.

export type Quality = 'auto' | 'low' | 'high'
export type ResolvedQuality = 'low' | 'high'

export interface QualitySettings {
  /** upper bound on devicePixelRatio */
  maxPixelRatio: number
  bloom: boolean
  starCount: number
  /** sphere segment count for the main body */
  planetSegments: number
}

const TIERS: Record<ResolvedQuality, QualitySettings> = {
  low: { maxPixelRatio: 1, bloom: false, starCount: 1800, planetSegments: 64 },
  high: { maxPixelRatio: 2, bloom: true, starCount: 4200, planetSegments: 128 },
}

let override: Quality = 'auto'

function detect(): ResolvedQuality {
  const cores = navigator.hardwareConcurrency ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  // phones and low-core machines get the cheap tier; everything else is high
  if (coarse || cores <= 4) return 'low'
  return 'high'
}

let detected: ResolvedQuality | null = null

export function setQuality(quality: Quality) {
  override = quality
}

export function resolvedQuality(): ResolvedQuality {
  if (override !== 'auto') return override
  if (!detected) detected = detect()
  return detected
}

export function qualitySettings(): QualitySettings {
  return TIERS[resolvedQuality()]
}
