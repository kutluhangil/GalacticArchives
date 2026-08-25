export type RenderCompatibility =
  | { supported: true; api: 'webgl2' | 'webgl'; recommendedQuality: 'high' | 'low' }
  | { supported: false; reason: 'webgl-unavailable' | 'context-creation-failed' }

/**
 * Performs the small capability probe before an imperative Three engine is
 * constructed. It reports the concrete browser limitation rather than letting
 * renderer construction fail with an opaque exception.
 */
export function detectRenderCompatibility(): RenderCompatibility {
  try {
    const canvas = document.createElement('canvas')
    if (canvas.getContext('webgl2')) {
      return { supported: true, api: 'webgl2', recommendedQuality: 'high' }
    }
    if (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) {
      return { supported: true, api: 'webgl', recommendedQuality: 'low' }
    }
    return { supported: false, reason: 'webgl-unavailable' }
  } catch {
    return { supported: false, reason: 'context-creation-failed' }
  }
}
