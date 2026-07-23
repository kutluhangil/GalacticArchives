// Minimal UI chrome strings for P1. Full i18next migration lands in P3.

import type { Lang } from './lore'

const STRINGS = {
  brand: { en: 'GALACTIC ARCHIVES', tr: 'GALACTIC ARCHIVES' },
  region: { en: 'Region', tr: 'Bölge' },
  sector: { en: 'Sector', tr: 'Sektör' },
  system: { en: 'System', tr: 'Sistem' },
  grid: { en: 'Grid', tr: 'Grid' },
  diameter: { en: 'Diameter', tr: 'Çap' },
  population: { en: 'Population', tr: 'Nüfus' },
  government: { en: 'Government', tr: 'Yönetim' },
  climate: { en: 'Climate', tr: 'İklim' },
  terrain: { en: 'Terrain', tr: 'Arazi' },
  moons: { en: 'Moons', tr: 'Aylar' },
  suns: { en: 'Suns', tr: 'Güneşler' },
  appearances: { en: 'Appearances', tr: 'Göründüğü Yapımlar' },
  didYouKnow: { en: 'From the Archives', tr: 'Arşivlerden' },
  affiliation: { en: 'Allegiance', tr: 'Bağlılık' },
  era: { en: 'Era', tr: 'Dönem' },
  enterSystem: { en: 'System view', tr: 'Sistem görünümü' },
  enterPlanet: { en: 'Approach planet', tr: 'Gezegene yaklaş' },
  dragHint: { en: 'drag to rotate · scroll to zoom', tr: 'çevirmek için sürükle · yakınlaşmak için kaydır' },
  clickPlanetHint: { en: 'click the planet to approach', tr: 'yaklaşmak için gezegene tıkla' },
  loading: { en: 'Accessing archives...', tr: 'Arşivlere erişiliyor...' },
  kmSuffix: { en: 'km', tr: 'km' },
} as const

export type UiKey = keyof typeof STRINGS

export const t = (key: UiKey, lang: Lang): string => STRINGS[key][lang]
