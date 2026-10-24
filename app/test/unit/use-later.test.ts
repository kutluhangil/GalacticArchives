// A timeout scheduled by a modal must die with the modal, or closing it
// mid-flash writes state into an unmounted tree.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLater } from '../../src/hooks/useLater'

afterEach(() => {
  vi.useRealTimers()
})

describe('useLater', () => {
  it('runs the callback after the delay while mounted', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const { result } = renderHook(() => useLater())
    result.current(fn, 200)
    vi.advanceTimersByTime(199)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('cancels every pending callback on unmount', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const { result, unmount } = renderHook(() => useLater())
    result.current(fn, 200)
    result.current(fn, 900)
    unmount()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('keeps the same function identity across renders', () => {
    const { result, rerender } = renderHook(() => useLater())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
