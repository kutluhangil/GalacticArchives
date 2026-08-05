// Roving tabindex for the archive's long lists and card grids. Left alone, the
// galaxy's keyboard mirror spends one Tab stop per world — 81 of them before
// anything under the map can be reached — and the Holocron grid another
// hundred. One item stays tabbable and the arrow keys move that spot.

import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'

const ITEM = '[data-roving-item]'

export type RovingOrientation = 'list' | 'grid'

/**
 * Group item indices into visual rows from their vertical offsets. A grid laid
 * out row by row keeps DOM order and visual order in step, so a change of
 * offset starts a new row.
 */
export function rowRanges(tops: number[]): number[][] {
  const rows: number[][] = []
  let last = Number.NaN
  tops.forEach((top, index) => {
    if (top !== last) {
      rows.push([])
      last = top
    }
    rows[rows.length - 1].push(index)
  })
  return rows
}

/** the item one row up or down, holding the column where the row is long enough */
function sameColumn(list: HTMLElement[], from: number, step: number): number {
  const rows = rowRanges(list.map((el) => el.offsetTop))
  const rowIndex = rows.findIndex((row) => row.includes(from))
  const target = rows[rowIndex + step]
  if (!target) return from
  const column = rows[rowIndex].indexOf(from)
  return target[Math.min(column, target.length - 1)]
}

function nextIndex(
  list: HTMLElement[],
  from: number,
  key: string,
  orientation: RovingOrientation,
): number | null {
  const last = list.length - 1
  switch (key) {
    case 'Home':
      return 0
    case 'End':
      return last
    case 'ArrowRight':
      return Math.min(from + 1, last)
    case 'ArrowLeft':
      return Math.max(from - 1, 0)
    case 'ArrowDown':
      return orientation === 'grid' ? sameColumn(list, from, 1) : Math.min(from + 1, last)
    case 'ArrowUp':
      return orientation === 'grid' ? sameColumn(list, from, -1) : Math.max(from - 1, 0)
    default:
      return null
  }
}

/**
 * Wire the returned `ref`/`onKeyDown` to the element wrapping the entries, and
 * mark each entry with `data-roving-item`.
 */
export function useRovingFocus<T extends HTMLElement>(orientation: RovingOrientation = 'list') {
  const ref = useRef<T>(null)

  const items = useCallback(
    () => (ref.current ? Array.from(ref.current.querySelectorAll<HTMLElement>(ITEM)) : []),
    [],
  )

  // After every commit, because filtering the list swaps DOM nodes in and a
  // fresh node arrives tabbable by default. Only the attribute we write counts
  // as a choice, so a removed entry hands the spot back to the first one.
  useEffect(() => {
    const list = items()
    if (!list.length) return
    const focused = list.find((el) => el === document.activeElement)
    const chosen = focused ?? list.find((el) => el.getAttribute('tabindex') === '0') ?? list[0]
    for (const el of list) el.tabIndex = el === chosen ? 0 : -1
  })

  const onKeyDown = useCallback(
    (event: KeyboardEvent<T>) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const list = items()
      const origin = (event.target as HTMLElement).closest<HTMLElement>(ITEM)
      const from = origin ? list.indexOf(origin) : -1
      if (from < 0) return
      const to = nextIndex(list, from, event.key, orientation)
      if (to === null) return
      // the arrows belong to the list once focus is inside it: letting the page
      // scroll underneath would move the entry out from under the reader
      event.preventDefault()
      const next = list[to]
      for (const el of list) el.tabIndex = el === next ? 0 : -1
      next.focus()
    },
    [items, orientation],
  )

  return { ref, onKeyDown }
}
