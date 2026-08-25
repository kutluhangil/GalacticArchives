import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectRenderCompatibility } from '../../src/lib/render-compatibility'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('detectRenderCompatibility', () => {
  it('prefers WebGL2 and recommends the high tier', () => {
    const getContext = ((kind: string) => (kind === 'webgl2' ? ({}) : null)) as unknown as typeof HTMLCanvasElement.prototype.getContext
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(getContext)

    expect(detectRenderCompatibility()).toEqual({ supported: true, api: 'webgl2', recommendedQuality: 'high' })
  })

  it('allows WebGL1 with a conservative quality recommendation', () => {
    const getContext = ((kind: string) => (kind === 'webgl' ? ({}) : null)) as unknown as typeof HTMLCanvasElement.prototype.getContext
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(getContext)

    expect(detectRenderCompatibility()).toEqual({ supported: true, api: 'webgl', recommendedQuality: 'low' })
  })

  it('reports a readable failure when no WebGL context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    expect(detectRenderCompatibility()).toEqual({ supported: false, reason: 'webgl-unavailable' })
  })
})
