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
  veil: VeilPhase
  tour: TourState | null
  clockSpeed: number
  clockPlaying: boolean
  setLang: (l: Lang) => void
  setEra: (e: EraId) => void
  setQuality: (q: Quality) => void
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

export const useApp = create<AppState>((set, get) => ({
  lang: storedLang,
  era: storedEra,
  quality: storedQuality,
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
