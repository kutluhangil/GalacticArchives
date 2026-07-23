// Bookkeeping for the era cross-dissolve. Lives beside <EraDissolve>: this hook
// freezes the outgoing frame in an engine view's rebuild cleanup and, when only
// the era changed (same body), surfaces it so the component can fade it out over
// the newly built scene.
//
// The capture lives inside the view's own engine effect on purpose: React runs
// each effect's cleanup before its setup, so capturing in cleanup and deciding
// in setup needs no fragile cross-component effect ordering.

import { useRef, useState } from 'react'

interface Snapshottable {
  snapshot(): string | null
}

export function useEraDissolve() {
  const [snap, setSnap] = useState<string | null>(null)
  const pending = useRef<string | null>(null)
  const lastKey = useRef<string | null>(null)

  return {
    snap,
    clear: () => setSnap(null),
    /** call in the engine effect's setup, after the new engine is built */
    onBuild: (key: string) => {
      // a pending frame with an unchanged key means the era, not the body,
      // changed — the one case that should dissolve rather than hard-swap
      if (pending.current && lastKey.current === key) setSnap(pending.current)
      pending.current = null
      lastKey.current = key
    },
    /** call in the engine effect's cleanup, before the engine is disposed */
    onTeardown: (engine: Snapshottable) => {
      pending.current = engine.snapshot()
    },
  }
}
