// The archive's own sections, in one table (src/data/sections.json) that both
// the running app and the static-meta build read. Section names used to be
// written twice — once in the top bar, once in scripts/build-static-meta.mjs —
// so a rename could land in the menu and not in the tab title.

import sections from '../data/sections.json'
import type { Lang } from './lore'

export const SITE_NAME = sections.siteName

/** The display name of an archive section, e.g. `/hangar` -> "Hangar". */
export function sectionName(path: string, lang: Lang): string {
  const section = sections.sections.find((s) => s.path === path)
  if (!section) throw new Error(`sections: no section is registered at "${path}"`)
  return section.name[lang]
}

/** `<record> — Galactic Archives`, the shape the static pages already use. */
export function recordTitle(name: string): string {
  return `${name} — ${SITE_NAME}`
}

/**
 * The tab title a path owes, or `null` when that title is a record name only
 * the page itself can supply. Null leaves the served title in place until the
 * record loads, instead of flashing the bare site name in the tab.
 */
export function titleForPath(path: string, lang: Lang): string | null {
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path
  if (normalized === '/') return sections.home.title[lang]
  const section = sections.sections.find((s) => s.path === normalized)
  if (section) return recordTitle(section.name[lang])
  if (sections.recordPrefixes.some((prefix) => normalized.startsWith(prefix))) return null
  return recordTitle(sections.notFound.title[lang])
}
