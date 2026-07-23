// The seam between two 3D views. A camera flight closes on the target, this
// veil dims for the last beat of it, the route swaps behind the dark, and the
// arriving view's own dive-in continues the same approach.

import { useEffect } from 'react'
import { useApp } from '../state/app'

const CLOSING_MS = 260
const OPENING_MS = 420
/** one frame past the route swap the arriving canvas has drawn */
const LIFT_DELAY = 90

export default function TransitionVeil() {
  const phase = useApp((s) => s.veil)
  const setVeil = useApp((s) => s.setVeil)
  const dark = phase === 'closing' || phase === 'closed'

  // Reopening is owned here, not by useFlyTo: the view that started the flight
  // unmounts on the route swap and its pending timers die with it, which used
  // to strand the veil at 'closed' — a black screen over the arriving world.
  useEffect(() => {
    if (phase === 'closed') {
      const id = window.setTimeout(() => setVeil('opening'), LIFT_DELAY)
      return () => window.clearTimeout(id)
    }
    if (phase === 'opening') {
      const id = window.setTimeout(() => setVeil('open'), OPENING_MS + 10)
      return () => window.clearTimeout(id)
    }
  }, [phase, setVeil])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 bg-space"
      style={{
        opacity: dark ? 1 : 0,
        visibility: phase === 'open' ? 'hidden' : 'visible',
        transition: `opacity ${phase === 'closing' ? CLOSING_MS : OPENING_MS}ms ease-out`,
      }}
    />
  )
}
