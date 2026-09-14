// Era change as a cross-dissolve. When the era flips, an engine view rebuilds
// its scene from scratch; on its own that reads as a hard cut. Paired with
// `useEraDissolve`, which freezes the outgoing frame — this fades that frozen
// frame out over the newly built scene, so one era dissolves into the next.

import { useEffect, useState } from 'react'

export default function EraDissolve({
  src,
  onDone,
}: {
  src: string
  onDone: () => void
}) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // hold the frozen frame for one painted frame, then transition it out
    const raf = requestAnimationFrame(() => setFading(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <img
      alt=""
      aria-hidden
      src={src}
      onTransitionEnd={onDone}
      className="pointer-events-none absolute inset-0 z-1 h-full w-full object-cover"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 600ms ease-out' }}
    />
  )
}
