// Global UI state: language, era, quality, view transition, clock mirrors.

import { create } from 'zustand'
import type { EraId } from '../types/lore'
import { simClock } from '../lib/sim-clock'

export type Lang = 'en' | 'tr'
export type Quality = 'auto' | 'low' | 'high'
/** open -> closing -> closed -> opening -> open, driven by useFlyTo */
export type VeilPhase = 'open' | 'closing' | 'closed' | 'opening'

/** an active guided tour: which one, and how far along */
export interface TourState {
  id: string
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
  veil: VeilPhase
  tour: TourState | null
  clockSpeed: number
  clockPlaying: boolean
  setLang: (l: Lang) => void
  setEra: (e: EraId) => void
  setQuality: (q: Quality) => void
  setLegends: (v: boolean) => void
  setLanes: (v: boolean) => void
  setVeil: (v: VeilPhase) => void
  startTour: (id: string) => void
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
// never boot into the Legends-only era with the layer off
const bootEra: EraId = storedEra === 'old-republic' && !storedLegends ? 'empire' : storedEra

export const useApp = create<AppState>((set, get) => ({
  lang: storedLang,
  era: bootEra,
  quality: storedQuality,
  legends: storedLegends,
  lanes: storedLanes,
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
  setVeil: (veil) => set({ veil }),
  startTour: (id) => set({ tour: { id, step: 0, playing: true } }),
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
