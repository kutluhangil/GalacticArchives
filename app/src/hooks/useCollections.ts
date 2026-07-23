// React view of the localStorage collections, kept in sync through the
// module's own subscription rather than by re-reading on every render.

import { useSyncExternalStore } from 'react'
import { favorites, recents, subscribeCollections } from '../lib/collections'

const EMPTY: string[] = []
let favSnapshot = EMPTY
let recentSnapshot = EMPTY

function subscribe(listener: () => void) {
  return subscribeCollections(() => {
    // invalidate the cached arrays so the identity check picks up the change
    favSnapshot = EMPTY
    recentSnapshot = EMPTY
    listener()
  })
}

function getFavorites(): string[] {
  if (favSnapshot === EMPTY) favSnapshot = favorites()
  return favSnapshot
}

function getRecents(): string[] {
  if (recentSnapshot === EMPTY) recentSnapshot = recents()
  return recentSnapshot
}

export function useFavorites(): string[] {
  return useSyncExternalStore(subscribe, getFavorites, () => EMPTY)
}

export function useRecents(): string[] {
  return useSyncExternalStore(subscribe, getRecents, () => EMPTY)
}
