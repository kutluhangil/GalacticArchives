// Global UI state: language, era, quality, view transition, clock mirrors.

import { create } from 'zustand'
import type { EraId } from '../types/lore'
import { simClock } from '../lib/sim-clock'

export type Lang = 'en' | 'tr'
export type Quality = 'auto' | 'low' | 'high'
/** open -> closing -> closed -> opening -> open, driven by useFlyTo */
export type VeilPhase = 'open' | 'closing' | 'closed' | 'opening'

/** where an active tour came from: a hand-written itinerary, or a hyperlane
 *  flown end to end. Both play through the same player. */
export type TourSource = { kind: 'authored'; id: string } | { kind: 'lane'; id: string }

/** an active guided tour: which one, and how far along */
export interface TourState {
  source: TourSource
  step: number
  playing: boolean
}

interface AppState {
  lang: Lang
  era: EraId
  quality: Quality
  /** show Legends-continuity worlds on the galaxy map alongside canon */
  legends: boolean
  /** draw the canon hyperlane network across the galaxy disk */
  lanes: boolean
  /** show faction territory overlay on galaxy map */
  territory: boolean
  /** interface sound effects; the engine keeps the same value in storage */
  sfx: boolean
  /** looping per-world soundscape on planet pages; opt-in, unlike the clicks */
  ambience: boolean
  veil: VeilPhase
  tour: TourState | null
  clockSpeed: number
  clockPlaying: boolean
  setLang: (l: Lang) => void
  setEra: (e: EraId) => void
  setQuality: (q: Quality) => void
  setLegends: (v: boolean) => void
  setLanes: (v: boolean) => void
  setTerritory: (v: boolean) => void
  setSfx: (v: boolean) => void
  setAmbience: (v: boolean) => void
  setVeil: (v: VeilPhase) => void
  startTour: (source: TourSource) => void
  setTourStep: (step: number) => void
  toggleTourPlaying: () => void
  endTour: () => void
  setClockSpeed: (s: number) => void
  toggleClockPlaying: () => void
}

const storedLang = (localStorage.getItem('ga-lang') as Lang | null) ?? 'tr'
const storedEra = (localStorage.getItem('ga-era') as EraId | null) ?? 'empire'
const storedQuality = (localStorage.getItem('ga-quality') as Quality | null) ?? 'auto'
const storedLegends = localStorage.getItem('ga-legends') === '1'
// lanes are part of what the map is, so they are on until switched off
const storedLanes = localStorage.getItem('ga-lanes') !== '0'
const storedTerritory = localStorage.getItem('ga-territory') === '1'
// sound is part of the console feel, so it is on until switched off
const storedSfx = localStorage.getItem('ga-sfx') !== '0'
// a continuous sound nobody asked for is a reason to close the tab: off until chosen
const storedAmbience = localStorage.getItem('ga-ambience') === '1'
// never boot into the Legends-only era with the layer off
const bootEra: EraId = storedEra === 'old-republic' && !storedLegends ? 'empire' : storedEra

export const useApp = create<AppState>((set, get) => ({
  lang: storedLang,
  era: bootEra,
  quality: storedQuality,
  legends: storedLegends,
  lanes: storedLanes,
  territory: storedTerritory,
  sfx: storedSfx,
  ambience: storedAmbience,
  veil: 'open',
  tour: null,
  clockSpeed: 1,
  clockPlaying: true,
  setLang: (lang) => {
    localStorage.setItem('ga-lang', lang)
    set({ lang })
  },
  setEra: (era) => {
    localStorage.setItem('ga-era', era)
    set({ era })
  },
  setQuality: (quality) => {
    localStorage.setItem('ga-quality', quality)
    set({ quality })
  },
  setLegends: (legends) => {
    localStorage.setItem('ga-legends', legends ? '1' : '0')
    // the Old Republic era only exists with the layer on; leaving it selected
    // when the layer is switched off would strand the timeline on a hidden era
    if (!legends && get().era === 'old-republic') {
      localStorage.setItem('ga-era', 'empire')
      set({ legends, era: 'empire' })
      return
    }
    set({ legends })
  },
  setLanes: (lanes) => {
    localStorage.setItem('ga-lanes', lanes ? '1' : '0')
    set({ lanes })
  },
  setTerritory: (territory) => {
    localStorage.setItem('ga-territory', territory ? '1' : '0')
    set({ territory })
  },
  setSfx: (sfxOn) => {
    // the audio engine reads this key when it is constructed, so a reload
    // respects the choice without the store having to reach it. Telling a
    // loaded engine is a dynamic import on purpose: the synthesiser is not
    // worth carrying in the first-paint chunk for a preference nobody may touch.
    localStorage.setItem('ga-sfx', sfxOn ? '1' : '0')
    void import('../lib/audio').then((m) => m.sfx.setMuted(!sfxOn))
    set({ sfx: sfxOn })
  },
  setAmbience: (ambience) => {
    localStorage.setItem('ga-ambience', ambience ? '1' : '0')
    set({ ambience })
  },
  setVeil: (veil) => set({ veil }),
  startTour: (source) => set({ tour: { source, step: 0, playing: true } }),
  setTourStep: (step) => {
    const tour = get().tour
    if (tour) set({ tour: { ...tour, step } })
  },
  toggleTourPlaying: () => {
    const tour = get().tour
    if (tour) set({ tour: { ...tour, playing: !tour.playing } })
  },
  endTour: () => set({ tour: null }),
  setClockSpeed: (s) => {
    simClock.setSpeed(s)
    set({ clockSpeed: s, clockPlaying: true })
  },
  toggleClockPlaying: () => {
    if (get().clockPlaying) simClock.pause()
    else simClock.resume()
    set({ clockPlaying: !get().clockPlaying })
  },
}))
