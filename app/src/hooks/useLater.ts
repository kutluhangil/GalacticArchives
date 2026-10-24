import { useCallback, useEffect, useRef } from 'react'

/**
 * `setTimeout` bound to the component's lifetime. Modals flash a state for a
 * moment ("copied", "firing") and the visitor can close them mid-flash; a bare
 * timeout then writes state into an unmounted tree.
 */
export function useLater() {
  const pending = useRef(new Set<number>())

  useEffect(() => {
    const ids = pending.current
    return () => {
      ids.forEach(clearTimeout)
      ids.clear()
    }
  }, [])

  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      pending.current.delete(id)
      fn()
    }, ms)
    pending.current.add(id)
  }, [])
}
