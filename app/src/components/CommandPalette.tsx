// ⌘K command palette: fuzzy search over planets (TR+EN names) and characters,
// jumping straight to the matching world through hyperspace.

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import type { CelestialBody, Character } from '../types/lore'
import { L, loadAllPlanets, loadCharacters, regions } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import { useJump } from './useJump'

export const OPEN_PALETTE_EVENT = 'ga-open-palette'

export default function CommandPalette() {
  const lang = useApp((s) => s.lang)
  const [open, setOpen] = useState(false)
  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const jump = useJump()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen)
    }
  }, [])

  useEffect(() => {
    if (!open || planets.length) return
    loadAllPlanets().then(setPlanets)
    loadCharacters().then(setCharacters)
  }, [open, planets.length])

  const go = (path: string) => {
    setOpen(false)
    jump(path)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 pt-[18vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-[560px] max-w-[calc(100vw-2rem)]">
        <Command
          label={t('search', lang)}
          className="overflow-hidden rounded-lg border border-holo-cyan/25 bg-panel/95 shadow-[0_0_40px_rgba(102,217,255,0.15)]"
        >
          <Command.Input
            autoFocus
            placeholder={t('searchPlaceholder', lang)}
            className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-[14px] text-slate-100 outline-none placeholder:text-slate-500"
          />
          <Command.List className="max-h-[46vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-[12px] text-slate-500">
              {t('noResults', lang)}
            </Command.Empty>
            <Command.Group
              heading={t('planets', lang)}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.25em] [&_[cmdk-group-heading]]:text-slate-500"
            >
              {planets.map((p) => (
                <Command.Item
                  key={p.id}
                  value={`${p.names.en} ${p.names.tr} ${p.id}`}
                  onSelect={() => go(`/planet/${p.id}`)}
                  className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-[13px] text-slate-200 aria-selected:bg-holo-cyan/15 aria-selected:text-holo-cyan"
                >
                  <span>{L(p.names, lang)}</span>
                  <span className="text-[10px] tracking-widest text-slate-500">
                    {L(regions.find((r) => r.id === p.region)?.names, lang)}
                    {p.coordinates ? ` · ${p.coordinates}` : ''}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group
              heading={t('charactersGroup', lang)}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.25em] [&_[cmdk-group-heading]]:text-slate-500"
            >
              {characters
                .filter((c) => c.homeworldId)
                .map((c) => (
                  <Command.Item
                    key={c.id}
                    value={`${c.names.en} ${c.names.tr} ${c.id}`}
                    onSelect={() => go(`/planet/${c.homeworldId}`)}
                    className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-[13px] text-slate-200 aria-selected:bg-holo-cyan/15 aria-selected:text-holo-cyan"
                  >
                    <span>{L(c.names, lang)}</span>
                    <span className="text-[10px] tracking-widest text-slate-500">
                      → {c.homeworldId}
                    </span>
                  </Command.Item>
                ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
