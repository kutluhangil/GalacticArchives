// Per-visitor lists kept in localStorage: starred worlds and where they have
// been. No account, no sync — the browser is the whole storage layer.

const FAV_KEY = 'ga-favorites'
const RECENT_KEY = 'ga-recents'
const RECENT_LIMIT = 8

type Listener = () => void
const listeners = new Set<Listener>()

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    // a hand-edited or truncated entry should not take the app down with it
    localStorage.removeItem(key)
    return []
  }
}

function write(key: string, value: string[]) {
  localStorage.setItem(key, JSON.stringify(value))
  for (const listener of listeners) listener()
}

export function favorites(): string[] {
  return read(FAV_KEY)
}

export function isFavorite(id: string): boolean {
  return read(FAV_KEY).includes(id)
}

export function toggleFavorite(id: string): boolean {
  const current = read(FAV_KEY)
  const next = current.includes(id) ? current.filter((v) => v !== id) : [id, ...current]
  write(FAV_KEY, next)
  return next.includes(id)
}

export function recents(): string[] {
  return read(RECENT_KEY)
}

/** most recent first, no duplicates, capped */
export function pushRecent(id: string) {
  const next = [id, ...read(RECENT_KEY).filter((v) => v !== id)].slice(0, RECENT_LIMIT)
  write(RECENT_KEY, next)
}

/** subscribe to any change; returns the unsubscribe */
export function subscribeCollections(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
