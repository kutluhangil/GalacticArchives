// Global UI state: language, era, quality, jump transition, clock mirrors.

import { create } from 'zustand'
import type { EraId } from '../types/lore'
import { audio } from '../lib/audio'
import { simClock } from '../lib/sim-clock'

export type Lang = 'en' | 'tr'
export type Quality = 'auto' | 'low' | 'high'

interface AppState {
  lang: Lang
  era: EraId
  quality: Quality
  jumping: boolean
  clockSpeed: number
  clockPlaying: boolean
  muted: boolean
  volume: number
  setLang: (l: Lang) => void
  setEra: (e: EraId) => void
  setQuality: (q: Quality) => void
  setJumping: (j: boolean) => void
  setClockSpeed: (s: number) => void
  toggleClockPlaying: () => void
  toggleMuted: () => void
  setVolume: (v: number) => void
}

const storedLang = (localStorage.getItem('ga-lang') as Lang | null) ?? 'tr'
const storedEra = (localStorage.getItem('ga-era') as EraId | null) ?? 'empire'
const storedQuality = (localStorage.getItem('ga-quality') as Quality | null) ?? 'auto'

export const useApp = create<AppState>((set, get) => ({
  lang: storedLang,
  era: storedEra,
  quality: storedQuality,
  jumping: false,
  clockSpeed: 1,
  clockPlaying: true,
  muted: audio.isMuted(),
  volume: audio.getVolume(),
  setLang: (lang) => {
    localStorage.setItem('ga-lang', lang)
    set({ lang })
  },
  setEra: (era) => {
    localStorage.setItem('ga-era', era)
    audio.play('era')
    set({ era })
  },
  setQuality: (quality) => {
    localStorage.setItem('ga-quality', quality)
    set({ quality })
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
    audio.setMuted(muted)
    if (!muted) audio.play('select')
    set({ muted })
  },
  setVolume: (volume) => {
    audio.setVolume(volume)
    set({ volume: audio.getVolume() })
  },
}))
