// Anchor-based simulation clock. performance.now is stubbed so the tests
// assert the anchor math rather than wall-clock timing.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { simClock } from '../../src/lib/sim-clock'

let now = 0
const advance = (ms: number) => {
  now += ms
}

beforeEach(() => {
  now = 1_000
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  // reset the module's anchors through its own API
  simClock.goNow()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('simClock', () => {
  it('runs at real time by default', () => {
    const start = simClock.getTime()
    advance(500)
    expect(simClock.getTime() - start).toBe(500)
    expect(simClock.getSpeed()).toBe(1)
    expect(simClock.isPlaying()).toBe(true)
  })

  it('multiplies elapsed time by the speed', () => {
    simClock.setSpeed(60)
    const start = simClock.getTime()
    advance(1_000)
    expect(simClock.getTime() - start).toBe(60_000)
  })

  it('carries the accumulated sim time across a speed change', () => {
    advance(1_000)
    const beforeChange = simClock.getTime()
    simClock.setSpeed(600)
    expect(simClock.getTime()).toBe(beforeChange)
    advance(10)
    expect(simClock.getTime() - beforeChange).toBe(6_000)
  })

  it('freezes while paused and resumes without a jump', () => {
    simClock.setSpeed(60)
    advance(100)
    simClock.pause()
    const frozen = simClock.getTime()
    advance(10_000)
    expect(simClock.getTime()).toBe(frozen)
    expect(simClock.isPlaying()).toBe(false)

    simClock.resume()
    expect(simClock.getTime()).toBe(frozen)
    advance(100)
    expect(simClock.getTime() - frozen).toBe(6_000)
  })

  it('ignores a redundant pause or resume', () => {
    simClock.pause()
    const frozen = simClock.getTime()
    simClock.pause()
    expect(simClock.getTime()).toBe(frozen)
    simClock.resume()
    simClock.resume()
    advance(50)
    expect(simClock.getTime() - frozen).toBe(50)
  })

  it('setSpeed always un-pauses', () => {
    simClock.pause()
    simClock.setSpeed(3_600)
    expect(simClock.isPlaying()).toBe(true)
    expect(simClock.getSpeed()).toBe(3_600)
  })

  it('goNow snaps back to real time at 1x', () => {
    simClock.setSpeed(600)
    advance(5_000)
    simClock.goNow()
    expect(simClock.getSpeed()).toBe(1)
    expect(simClock.isPlaying()).toBe(true)
    expect(Math.abs(simClock.getTime() - Date.now())).toBeLessThan(1_000)
  })
})
