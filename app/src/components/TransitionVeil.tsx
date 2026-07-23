// The seam between two 3D views. A camera flight closes on the target, this
// veil dims for the last beat of it, the route swaps behind the dark, and the
// arriving view's own dive-in continues the same approach.

import { useApp } from '../state/app'

export default function TransitionVeil() {
  const phase = useApp((s) => s.veil)
  const dark = phase === 'closing' || phase === 'closed'
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 bg-space"
      style={{
        opacity: dark ? 1 : 0,
        visibility: phase === 'open' ? 'hidden' : 'visible',
        transition: `opacity ${phase === 'closing' ? 260 : 420}ms ease-out`,
      }}
    />
  )
}
