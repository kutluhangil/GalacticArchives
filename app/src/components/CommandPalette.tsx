// ⌘K command palette: fuzzy search over planets (TR+EN names) and characters,
// jumping straight to the matching world through hyperspace. Mounted only
// while open — see CommandPaletteHost.

import { useEffect, useMemo, useState } from 'react'
import { Command } from 'cmdk'
import type { CelestialBody, Character } from '../types/lore'
import { L, loadAllPlanets, loadCharacters, regions, sectorShort } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import { useFlyTo } from './useFlyTo'

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const legends = useApp((s) => s.legends)
  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [region, setRegion] = useState<string>('')
  const jump = useFlyTo()

  useEffect(() => {
    loadAllPlanets().then(setPlanets)
    loadCharacters().then(setCharacters)
  }, [])

  // Legends worlds surface in search only when the layer is switched on
  const visiblePlanets = useMemo(
    () => planets.filter((p) => legends || p.continuity !== 'legends'),
    [planets, legends],
  )

  // regions that actually have visible worlds, in canonical order
  const activeRegions = useMemo(
    () => regions.filter((r) => visiblePlanets.some((p) => p.region === r.id)),
    [visiblePlanets],
  )
  const shownPlanets = useMemo(
    () => (region ? visiblePlanets.filter((p) => p.region === region) : visiblePlanets),
    [visiblePlanets, region],
  )

  const go = (path: string) => {
    onClose()
    jump(path)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 pt-[18vh] backdrop-blur-sm"
      onClick={onClose}
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
          <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-2 py-1.5">
            <button
              onClick={() => setRegion('')}
              className={`shrink-0 rounded px-2 py-0.5 text-[10.5px] tracking-wide transition-colors ${
                region === ''
                  ? 'bg-holo-cyan/20 text-holo-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('allRegions', lang)}
            </button>
            {activeRegions.map((r) => (
              <button
                key={r.id}
                onClick={() => setRegion((cur) => (cur === r.id ? '' : r.id))}
                className={`shrink-0 rounded px-2 py-0.5 text-[10.5px] tracking-wide transition-colors ${
                  region === r.id
                    ? 'bg-holo-cyan/20 text-holo-cyan'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {L(r.names, lang)}
              </button>
            ))}
          </div>
          <Command.List className="max-h-[46vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-[12px] text-slate-500">
              {t('noResults', lang)}
            </Command.Empty>
            <Command.Group
              heading={t('planets', lang)}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.25em] [&_[cmdk-group-heading]]:text-slate-500"
            >
              {shownPlanets.map((p) => (
                <Command.Item
                  key={p.id}
                  // the sector rides in the search value, so typing "Arkanis"
                  // gathers the three worlds canon puts in that sector — the
                  // one grouping the map cannot draw, since no canon borders
                  // exist to trace
                  value={`${p.names.en} ${p.names.tr} ${p.id}${p.sector ? ` ${p.sector}` : ''}`}
                  onSelect={() => go(`/planet/${p.id}`)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded px-3 py-2 text-[13px] text-slate-200 aria-selected:bg-holo-cyan/15 aria-selected:text-holo-cyan"
                >
                  <span>{L(p.names, lang)}</span>
                  <span className="shrink-0 text-[10px] tracking-widest text-slate-500">
                    {L(regions.find((r) => r.id === p.region)?.names, lang)}
                    {p.sector ? ` · ${sectorShort(p.sector)}` : ''}
                    {p.coordinates ? ` · ${p.coordinates}` : ''}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
            {/* a region filter is planet-specific, so characters step aside */}
            {!region && (
              <Command.Group
                heading={t('charactersGroup', lang)}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.25em] [&_[cmdk-group-heading]]:text-slate-500"
              >
                {characters.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={`${c.names.en} ${c.names.tr} ${c.id}`}
                    onSelect={() => go(`/holocron/character/${c.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-[13px] text-slate-200 aria-selected:bg-holo-cyan/15 aria-selected:text-holo-cyan"
                  >
                    <span>{L(c.names, lang)}</span>
                    <span className="text-[10px] tracking-widest text-slate-500">
                      {L(c.species, lang)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
