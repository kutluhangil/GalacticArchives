// Navigation as a camera move. The caller hands in the flight the current
// engine should run; the route swap happens once that flight has landed, so
// the viewer sees one continuous approach instead of a cut.

import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../state/app'

/** the veil starts dimming this long before the flight lands */
const VEIL_LEAD = 260

export function useFlyTo() {
  const navigate = useNavigate()
  const setVeil = useApp((s) => s.setVeil)
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id)
    },
    [],
  )

  /** `flight` starts the departing view's camera move and returns its duration;
   *  0 (or omitted) navigates immediately, which is also the reduced-motion path */
  return useCallback(
    (path: string, flight?: () => number) => {
      const ms = flight?.() ?? 0
      if (!ms) {
        navigate(path)
        return
      }
      // only the closing half lives here — this hook unmounts with the
      // departing view, so TransitionVeil owns lifting the veil again
      timers.current.push(
        window.setTimeout(() => setVeil('closing'), Math.max(ms - VEIL_LEAD, 0)),
        window.setTimeout(() => {
          setVeil('closed')
          navigate(path)
        }, ms),
      )
    },
    [navigate, setVeil],
  )
}
