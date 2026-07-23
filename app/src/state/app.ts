// Global UI state: language, era, jump transition, clock mirrors.

import { create } from 'zustand'
import type { EraId } from '../types/lore'
import { simClock } from '../lib/sim-clock'

export type Lang = 'en' | 'tr'

interface AppState {
  lang: Lang
  era: EraId
  jumping: boolean
  clockSpeed: number
  clockPlaying: boolean
  muted: boolean
  setLang: (l: Lang) => void
  setEra: (e: EraId) => void
  setJumping: (j: boolean) => void
  setClockSpeed: (s: number) => void
  toggleClockPlaying: () => void
  toggleMuted: () => void
}

const storedLang = (localStorage.getItem('ga-lang') as Lang | null) ?? 'tr'
const storedEra = (localStorage.getItem('ga-era') as EraId | null) ?? 'empire'

export const useApp = create<AppState>((set, get) => ({
  lang: storedLang,
  era: storedEra,
  jumping: false,
  clockSpeed: 1,
  clockPlaying: true,
  muted: localStorage.getItem('ga-muted') === '1',
  setLang: (lang) => {
    localStorage.setItem('ga-lang', lang)
    set({ lang })
  },
  setEra: (era) => {
    localStorage.setItem('ga-era', era)
    set({ era })
  },
  setJumping: (jumping) => set({ jumping }),
  setClockSpeed: (s) => {
    simClock.setSpeed(s)
    set({ clockSpeed: s, clockPlaying: true })
  },
  toggleClockPlaying: () => {
    if (get().clockPlaying) simClock.pause()
    else simClock.resume()
    set({ clockPlaying: !get().clockPlaying })
  },
  toggleMuted: () => {
    const muted = !get().muted
    localStorage.setItem('ga-muted', muted ? '1' : '0')
    set({ muted })
  },
}))
